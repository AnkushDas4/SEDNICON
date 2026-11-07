/**
 * Sednicon — Multi-Provider Upstream Orchestrator
 * Features: Request coalescing, tiered provider priority, hedged concurrency,
 * circuit breaker filtering, and strict SVG validation before return.
 */

import { getProvider } from './providers/registry.js';
import { getCircuitBreaker } from './circuit-breaker.js';
import { recordProviderExecution } from './metrics.js';
import { validateSvg } from './svg-sanitizer.js';

// Ensure all providers are loaded and registered
import './providers/jsdelivr-npm.js';
import './providers/unpkg-npm.js';
import './providers/iconify-api.js';
import './providers/iconify-json.js';
import './providers/devicon.js';
import './providers/svgl.js';
import './providers/crypto-icons.js';

const DEFAULT_PRIMARY_TIMEOUT_MS = 1800;
const DEFAULT_SECONDARY_TIMEOUT_MS = 2500;
const DEFAULT_HEDGE_DELAY_MS = 350;
const DEFAULT_OVERALL_DEADLINE_MS = 6000;

// Request coalescing map: in-flight deduplication of concurrent identical requests
const inFlightRequests = new Map();

/**
 * Returns prioritized candidate providers for a given icon collection.
 * @param {string} collection 
 * @returns {Array<object>}
 */
export function getOrchestratorCandidates(collection) {
  const normCol = (collection || '').toLowerCase().trim();

  // 1. Specialized providers (Tier 4)
  if (normCol === 'devicon' || normCol === 'devicons') {
    return [getProvider('devicon'), getProvider('jsdelivr-npm'), getProvider('iconify-json'), getProvider('iconify-api')].filter(Boolean);
  }
  if (normCol === 'svgl') {
    return [getProvider('svgl'), getProvider('jsdelivr-npm'), getProvider('iconify-json'), getProvider('iconify-api')].filter(Boolean);
  }
  if (normCol === 'crypto' || normCol === 'cryptocurrency' || normCol === 'cryptocurrency-icons') {
    return [getProvider('crypto-icons'), getProvider('jsdelivr-npm'), getProvider('iconify-json'), getProvider('iconify-api')].filter(Boolean);
  }

  // 2. Direct npm package collections (Tier 2 primary, Tier 3 secondary)
  const jsdelivr = getProvider('jsdelivr-npm');
  if (jsdelivr && jsdelivr.supports(normCol)) {
    return [jsdelivr, getProvider('unpkg-npm'), getProvider('iconify-json'), getProvider('iconify-api')].filter(Boolean);
  }

  // 3. Universal collections (Tier 3 API mirrors primary, JSON package fallback)
  return [getProvider('iconify-api'), getProvider('iconify-json'), getProvider('jsdelivr-npm'), getProvider('unpkg-npm')].filter(Boolean);
}

/**
 * Executes an individual provider attempt with timeout, metrics, and circuit breaker.
 * @param {object} provider 
 * @param {string} collection 
 * @param {string} iconName 
 * @param {object} options 
 * @returns {Promise<{ svg: string, source: string, provider: string } | null>}
 */
async function attemptProvider(provider, collection, iconName, options = {}) {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || provider.timeoutMs || DEFAULT_PRIMARY_TIMEOUT_MS;

  try {
    const res = await provider.resolve(collection, iconName, { ...options, timeoutMs });
    const latencyMs = Date.now() - startTime;

    if (res && res.svg) {
      // Security check: validate SVG structure before accepting
      const val = validateSvg(res.svg);
      if (val.valid) {
        recordProviderExecution(provider.id, { success: true, latencyMs });
        return {
          svg: res.svg,
          source: res.source,
          provider: provider.id,
          latencyMs,
        };
      }
      // Invalid SVG received from upstream
      recordProviderExecution(provider.id, { success: false, latencyMs, error: val.error || 'Invalid SVG payload' });
      return null;
    }

    recordProviderExecution(provider.id, { success: false, latencyMs, error: 'Icon not found (404)' });
    return null;
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError' || latencyMs >= timeoutMs;
    recordProviderExecution(provider.id, { success: false, latencyMs, isTimeout, error: err.message });
    return null;
  }
}

/**
 * Core orchestration logic: runs hedged requests across prioritized providers.
 */
async function executeOrchestration(collection, iconName, options = {}) {
  const candidates = getOrchestratorCandidates(collection);
  const hedgeDelayMs = options.hedgeDelayMs ?? DEFAULT_HEDGE_DELAY_MS;
  const deadlineMs = options.deadlineMs ?? DEFAULT_OVERALL_DEADLINE_MS;

  // Filter candidates whose circuit breaker is not OPEN
  const viable = candidates.filter((p) => {
    const cb = getCircuitBreaker(p.id);
    return cb.canAttempt();
  });

  if (!viable.length) return null;

  let deadlineTimer = null;
  const deadlinePromise = new Promise((resolve) => {
    deadlineTimer = setTimeout(() => resolve(null), deadlineMs);
    if (deadlineTimer && typeof deadlineTimer.unref === 'function') {
      deadlineTimer.unref();
    }
  });

  // Run primary provider
  const primaryProvider = viable[0];
  const primaryPromise = attemptProvider(primaryProvider, collection, iconName, {
    ...options,
    timeoutMs: DEFAULT_PRIMARY_TIMEOUT_MS,
  });

  // If there's only 1 viable provider, await it directly
  if (viable.length === 1) {
    return Promise.race([primaryPromise, deadlinePromise]).then((res) => {
      if (deadlineTimer) clearTimeout(deadlineTimer);
      return res;
    });
  }

  // Set up hedged secondary provider
  let hedgeTimer = null;
  const secondaryPromise = new Promise((resolve) => {
    hedgeTimer = setTimeout(async () => {
      const secondaryProvider = viable[1];
      const res = await attemptProvider(secondaryProvider, collection, iconName, {
        ...options,
        timeoutMs: DEFAULT_SECONDARY_TIMEOUT_MS,
      });
      resolve(res);
    }, hedgeDelayMs);
    if (hedgeTimer && typeof hedgeTimer.unref === 'function') {
      hedgeTimer.unref();
    }
  });

  // Controlled race: take first that succeeds with valid SVG
  return Promise.race([
    primaryPromise.then((res) => {
      if (res) {
        if (hedgeTimer) clearTimeout(hedgeTimer);
        return res;
      }
      // Primary failed; await secondary
      return secondaryPromise;
    }),
    secondaryPromise.then((res) => {
      if (res) return res;
      // If secondary failed, fallback to waiting for primary
      return primaryPromise;
    }),
    deadlinePromise,
  ]).then(async (result) => {
    if (deadlineTimer) clearTimeout(deadlineTimer);
    if (hedgeTimer) clearTimeout(hedgeTimer);

    if (result) return result;

    // If both primary and secondary failed and more candidates exist (Tier 3/4 fallbacks), try next in sequence
    for (let i = 2; i < viable.length; i++) {
      const fallback = viable[i];
      const res = await attemptProvider(fallback, collection, iconName, {
        ...options,
        timeoutMs: DEFAULT_SECONDARY_TIMEOUT_MS,
      });
      if (res) return res;
    }
    return null;
  });
}

/**
 * Public orchestrator resolver with request coalescing.
 * @param {string} collection 
 * @param {string} iconName 
 * @param {object} options 
 * @returns {Promise<{ svg: string, source: string, provider: string, latencyMs: number } | null>}
 */
export async function resolveWithOrchestration(collection, iconName, options = {}) {
  const coalescingKey = `${collection}:${iconName}:${options.style || ''}`;

  if (inFlightRequests.has(coalescingKey)) {
    return inFlightRequests.get(coalescingKey);
  }

  const promise = executeOrchestration(collection, iconName, options).finally(() => {
    inFlightRequests.delete(coalescingKey);
  });

  inFlightRequests.set(coalescingKey, promise);
  return promise;
}
