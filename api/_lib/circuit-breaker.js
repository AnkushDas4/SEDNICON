/**
 * Sednicon — Provider Circuit Breaker
 * Manages independent 3-state failure containment per upstream provider:
 * CLOSED (normal), OPEN (tripped/failing), and HALF_OPEN (controlled probe).
 */

export class CircuitBreaker {
  constructor(id, options = {}) {
    this.id = id;
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownMs = options.cooldownMs || 30000; // 30s cooldown before probe
    
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
    this.lastStateChange = Date.now();
  }

  getState() {
    // Check if cooldown has elapsed while in OPEN state
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime >= this.cooldownMs) {
      this.state = 'HALF_OPEN';
      this.lastStateChange = Date.now();
    }
    return this.state;
  }

  canAttempt() {
    const currentState = this.getState();
    if (currentState === 'CLOSED') return true;
    if (currentState === 'HALF_OPEN') return true; // Allow single recovery probe
    return false; // OPEN: fast-fail without hammering upstream
  }

  recordSuccess(_latencyMs) {
    this.consecutiveFailures = 0;
    if (this.state !== 'CLOSED') {
      this.state = 'CLOSED';
      this.lastStateChange = Date.now();
    }
  }

  recordFailure(_reason) {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
    this.lastStateChange = Date.now();
  }
}

const breakers = new Map();

export function getCircuitBreaker(providerId, options = {}) {
  let cb = breakers.get(providerId);
  if (!cb) {
    cb = new CircuitBreaker(providerId, options);
    breakers.set(providerId, cb);
  }
  return cb;
}

export function resetCircuitBreakers() {
  breakers.clear();
}
