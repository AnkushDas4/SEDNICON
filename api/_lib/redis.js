/**
 * Sednicon — Redis & Edge Cache Compatibility Layer
 * Re-exports resilient two-tier cache (L1 LRU + L2 Upstash/Redis)
 * for backward compatibility across all endpoints and tests.
 */

export {
  cacheGet,
  cacheSet,
  cacheSetNegative,
  checkRateLimit,
  resetCacheState as resetState,
  getCacheMetrics,
  DEFAULT_TTL_SEC,
  NEGATIVE_TTL_SEC,
  METADATA_TTL_SEC
} from './cache.js';
