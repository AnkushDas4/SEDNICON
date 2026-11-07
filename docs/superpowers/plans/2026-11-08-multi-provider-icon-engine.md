# Multi-Provider Icon Resolution Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Sednicon icon engine from a single-upstream (Iconify) dependency into a resilient, multi-provider icon resolution infrastructure supporting npm CDNs (jsDelivr, unpkg), specialized providers (Devicon, SVGL, Cryptocurrency-Icons), Universal Iconify JSON package extraction, hedged concurrent requests, circuit breakers, 2-tier caching (L1/L2), and strict SVG security sanitization.

**Architecture:** Edge-first, modular architecture under `api/_lib/`. Providers (`api/_lib/providers/*`) expose a standard interface (`resolve(iconName, options)`) registered in `api/_lib/providers/registry.js`. An orchestrator (`api/_lib/orchestrator.js`) manages tier prioritization, hedged request fallbacks, request coalescing, and per-provider circuit breakers (`api/_lib/circuit-breaker.js`). A two-tier cache (`api/_lib/cache.js`) coordinates bounded L1 in-memory LRU and non-blocking L2 Redis/Upstash. A security-hardened SVG validator/sanitizer (`api/_lib/svg-sanitizer.js`) and transformer (`api/_lib/svg-transformer.js`) ensure clean, safe, and styleable output.

**Tech Stack:** JavaScript (ES modules), Vercel Edge Runtime & Node 18+, fast-xml-parser / native web standards (`fetch`, `Request`, `Response`, `AbortController`), Upstash Redis REST.

**Spec:** USER_REQUEST prompt (Multi-Provider Icon Resolution Engine)

## Global Constraints
- Zero breaking changes to public APIs: `GET /api/render`, `POST /api/sprite`, `GET /api/status`, `POST /api/generate`.
- All 21 existing unit/API tests (`npm test`) must continue to pass without regressions.
- Vercel Edge Runtime compatibility: zero Node-only C++ addons, zero fs calls in edge handlers.
- Safe resilience: Redis and upstream provider failures must degrade gracefully without crashing requests.
- No secrets, credentials, or environment variables exposed in public endpoints or health checks.

---

### Task 1: SVG Validator & Security Sanitizer

**Files:**
- Create: `api/_lib/svg-sanitizer.js`
- Test: `test/svg-sanitizer.test.js`
- Modify: `api/_lib/icon-resolver.js` (re-export `sanitizeSvg`)

**Interfaces:**
- Consumes: Raw SVG string, max payload size (default 512 KB)
- Produces: `validateSvg(svgString)` -> `{ valid: boolean, error?: string }`, `sanitizeSvg(svgString)` -> `string` (sanitized safe SVG)

- [ ] **Step 1: Write comprehensive failing tests for SVG validator and sanitizer**
  Covers script injection, event handler injection (spaces, newlines, slashes, unquoted), XXE DOCTYPEs, dangerous hrefs (`javascript:`, `data:`, `vbscript:`, `file:`, `https://evil.com`), foreignObject, iframe, malformed XML, payload size limits, and preservation of legitimate paths, gradients, masks, and clipPaths.

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test test/svg-sanitizer.test.js`

- [ ] **Step 3: Implement `api/_lib/svg-sanitizer.js`**
  Implements multi-pass sanitization: strips XML declarations safely, rejects DOCTYPE/XXE, parses and strips disallowed tags, strips all `on*` event handlers across all formatting variations, validates and sanitizes `href` and `xlink:href` to only allow safe local fragments (`#id`), validates viewBox, width, height, and ensures root is `<svg>`.

- [ ] **Step 4: Run test to verify pass**
  Run: `node --test test/svg-sanitizer.test.js && node --test test/icon-resolver.test.js`

- [ ] **Step 5: Commit**
  `git add api/_lib/svg-sanitizer.js test/svg-sanitizer.test.js && git commit -m "feat(security): implement multi-pass svg validator and sanitizer"`

---

### Task 2: SVG Transformer with Multi-Color & Style Intelligence

**Files:**
- Create: `api/_lib/svg-transformer.js`
- Test: `test/svg-transformer.test.js`
- Modify: `api/_lib/icon-resolver.js` (re-export `svgTransformer`)

**Interfaces:**
- Consumes: `svgTransformer(svgRaw, size, cleanColor, anim, options)`
  - `options`: `{ strokeWidth, stroke, fill, preserveOriginal, style }`
- Produces: Transformed SVG string with responsive dimensions, animations (`spin`, `pulse`, `bounce`), and preserved multi-color branding.

- [ ] **Step 1: Write failing tests for SVG transformer**
  Test size injection, single-color recoloring, currentColor replacement, multi-color detection (preserving multi-stop gradients and brand paths when no explicit recolor or preserveOriginal is set), and keyframe animation injection (`spin`, `pulse`, `bounce`).

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test test/svg-transformer.test.js`

- [ ] **Step 3: Implement `api/_lib/svg-transformer.js`**
  Implements attribute injection for width and height, animation style block with scoped keyframes and `overflow: visible`, multi-color palette detector, and color normalizer.

- [ ] **Step 4: Run test to verify pass**
  Run: `node --test test/svg-transformer.test.js && node --test test/icon-resolver.test.js`

- [ ] **Step 5: Commit**
  `git add api/_lib/svg-transformer.js test/svg-transformer.test.js && git commit -m "feat(transform): implement color-aware svg transformer and animation engine"`

---

### Task 3: Two-Tier Cache Architecture (L1 Memory LRU + L2 Upstash/Redis)

**Files:**
- Create: `api/_lib/cache.js`
- Modify: `api/_lib/redis.js` (delegate to `cache.js` while maintaining backward-compatible exports)
- Test: `test/cache.test.js`

**Interfaces:**
- Consumes: `cacheKey`, `value`, `ttlMs`
- Produces:
  - `cacheGet(key)` -> `Promise<any>`
  - `cacheSet(key, value, ttlMs)` -> `Promise<void>`
  - `checkRateLimit(ip, weight)` -> `Promise<boolean>`
  - `resetCacheState()` -> `void`
  - `getCacheMetrics()` -> `{ l1Items: number, l2Status: string }`

- [ ] **Step 1: Write failing tests for 2-tier cache and resilience**
  Tests L1 cache hit, TTL expiration, max items LRU eviction, non-blocking L2 Redis interaction, and graceful fallback when Redis fails or is unconfigured.

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test test/cache.test.js`

- [ ] **Step 3: Implement `api/_lib/cache.js` and connect `api/_lib/redis.js`**
  Implements bounded LRU Map for L1, Upstash REST HTTP client for L2, non-blocking error boundary, and rate-limiting sliding window.

- [ ] **Step 4: Run test to verify pass**
  Run: `node --test test/cache.test.js && node --test test/rate-limit.test.js`

- [ ] **Step 5: Commit**
  `git add api/_lib/cache.js api/_lib/redis.js test/cache.test.js && git commit -m "feat(cache): implement resilient two-tier l1/l2 edge cache"`

---

### Task 4: Circuit Breaker & Provider Health Metrics

**Files:**
- Create: `api/_lib/circuit-breaker.js`
- Create: `api/_lib/metrics.js`
- Test: `test/circuit-breaker.test.js`

**Interfaces:**
- Circuit states: `CLOSED`, `OPEN`, `HALF_OPEN`
- Consumes: Provider execution calls
- Produces: `executeWithCircuitBreaker(providerId, actionFn, timeoutMs)`, `getProviderMetrics(providerId)`, `getAllProviderHealth()`

- [ ] **Step 1: Write failing tests for Circuit Breaker and Metrics**
  Test normal execution (CLOSED), tripping after N consecutive failures (OPEN), fast-failing during OPEN, recovery test probe after cooldown (HALF_OPEN), successful restoration to CLOSED, and metrics recording (latencies, success rates, timestamps).

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test test/circuit-breaker.test.js`

- [ ] **Step 3: Implement `api/_lib/circuit-breaker.js` and `api/_lib/metrics.js`**
  Implements state machine, configurable cooldown (30s), failure threshold (5), timeout handling via `AbortController`, and rolling latency statistics.

- [ ] **Step 4: Run test to verify pass**
  Run: `node --test test/circuit-breaker.test.js`

- [ ] **Step 5: Commit**
  `git add api/_lib/circuit-breaker.js api/_lib/metrics.js test/circuit-breaker.test.js && git commit -m "feat(resilience): implement provider circuit breakers and health telemetry"`

---

### Task 5: Extensible Provider Registry & Concrete Providers

**Files:**
- Create: `api/_lib/providers/registry.js`
- Create: `api/_lib/providers/base-provider.js`
- Create: `api/_lib/providers/iconify-api.js` (Provider A: Iconify API mirrors)
- Create: `api/_lib/providers/jsdelivr-npm.js` (Provider B: jsDelivr npm CDN packages: Lucide, Simple Icons, Tabler, Heroicons, Phosphor, Bootstrap, Feather, Octicons)
- Create: `api/_lib/providers/unpkg-npm.js` (Provider C: unpkg npm CDN fallback)
- Create: `api/_lib/providers/devicon.js` (Provider D: Devicon GitHub/CDN)
- Create: `api/_lib/providers/svgl.js` (Provider E: SVGL API & verified mirrors)
- Create: `api/_lib/providers/crypto-icons.js` (Provider F: Cryptocurrency Icons)
- Create: `api/_lib/providers/iconify-json.js` (Provider G: Universal Iconify JSON package parser)
- Test: `test/providers.test.js`

**Interfaces:**
- Provider interface:
  ```javascript
  {
    id: string,
    resolve(iconName, options): Promise<{ svg: string, source: string } | null>,
    supports(collection, style): boolean
  }
  ```

- [ ] **Step 1: Write failing tests for each provider**
  Uses mocked network responses to test:
  - jsDelivr package resolution for Lucide, Simple Icons, Tabler (outline/filled), Heroicons (24/outline, 24/solid), Phosphor (regular, fill, duotone), Bootstrap, Feather, Octicons.
  - unpkg fallback.
  - Devicon original and plain variants.
  - SVGL light and dark variants.
  - Cryptocurrency icons (color, black, white).
  - Universal Iconify JSON package extractor (extracts SVG directly from collection JSON without Iconify API).
  - Iconify API fallback mirrors.

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test test/providers.test.js`

- [ ] **Step 3: Implement registry and all providers**
  Implements verified URL routes, metadata pinning, alias handling, and collection extractors.

- [ ] **Step 4: Run test to verify pass**
  Run: `node --test test/providers.test.js`

- [ ] **Step 5: Commit**
  `git add api/_lib/providers/ test/providers.test.js && git commit -m "feat(providers): implement modular provider registry and 7 independent icon sources"`

---

### Task 6: Orchestrator (Hedged Requests, Concurrency, Request Coalescing)

**Files:**
- Create: `api/_lib/orchestrator.js`
- Test: `test/orchestrator.test.js`

**Interfaces:**
- Consumes: `resolveWithOrchestrator(q, options)`
  - `options`: `{ setHint, style, timeoutMs, deadlineMs }`
- Produces: `{ svg: string, source: string, provider: string, latencyMs: number }`

- [ ] **Step 1: Write failing tests for Orchestrator**
  Test tier ranking, hedged request start after configurable delay (350ms), request coalescing (2 concurrent identical requests share 1 upstream call), circuit breaker integration, overall deadline abort, and graceful fallback.

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test test/orchestrator.test.js`

- [ ] **Step 3: Implement `api/_lib/orchestrator.js`**
  Implements request coalescing map, hedged concurrency logic, tier selection, and abort signals.

- [ ] **Step 4: Run test to verify pass**
  Run: `node --test test/orchestrator.test.js`

- [ ] **Step 5: Commit**
  `git add api/_lib/orchestrator.js test/orchestrator.test.js && git commit -m "feat(orchestrator): implement hedged requests and request coalescing"`

---

### Task 7: Integrate Resolver, Render API, Sprite API, and Health Endpoint

**Files:**
- Modify: `api/_lib/icon-resolver.js` (refactor to delegate to orchestrator, sanitizer, transformer while preserving all exported constants and methods)
- Modify: `api/render.js` (support `style` param, use orchestrator metadata, attach diagnostic headers)
- Modify: `api/sprite.js` (support GET alongside POST, integrate updated resolver)
- Modify: `api/status.js` (report multi-provider health and cache status)
- Create: `api/health/providers.js` (dedicated health endpoint)
- Test: `test/render.test.js`, `test/sprite.test.js`, `test/status.test.js`

- [ ] **Step 1: Write failing tests for new API capabilities**
  Test `style` parameter on `/api/render`, GET support on `/api/sprite`, and `/api/health/providers` JSON schema.

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test test/sprite.test.js test/health.test.js`

- [ ] **Step 3: Implement updates to `api/render.js`, `api/sprite.js`, `api/status.js`, `api/health/providers.js`, and `api/_lib/icon-resolver.js`**

- [ ] **Step 4: Run test to verify pass**
  Run: `npm test`

- [ ] **Step 5: Commit**
  `git add api/ test/ && git commit -m "feat(api): integrate multi-provider engine with render, sprite, status, and health endpoints"`

---

### Task 8: Verification, Build, Documentation, and Delivery

**Files:**
- Modify: `README.md`
- Modify: `docs/` (update architecture, supported providers table, environment variables)
- Verify: Full test suite (`npm test`), production build (`npm run build`)

- [ ] **Step 1: Update documentation**
  Document architecture, providers, supported collections, styles, caching policy, circuit breakers, and `/api/health/providers`.

- [ ] **Step 2: Run full verification suite**
  Run: `npm test` and `npm run build`

- [ ] **Step 3: Commit and push**
  `git add -A && git commit -m "docs: document multi-provider icon resolution engine and verification results"`
  `git push origin main`

- [ ] **Step 4: Final delivery report**
  Report all 12 items requested by user prompt.
