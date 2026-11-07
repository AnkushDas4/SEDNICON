/**
 * Sednicon — Central Provider Registry
 * Maintains provider instances, priority tiers, prefix mappings, and style conventions.
 */

const registry = new Map();

/**
 * Registers an icon provider into the system.
 * @param {object} provider 
 */
export function registerProvider(provider) {
  if (!provider || !provider.id) {
    throw new Error('Provider must have an id');
  }
  registry.set(provider.id, provider);
}

/**
 * Retrieves a registered provider by ID.
 * @param {string} id 
 * @returns {object|undefined}
 */
export function getProvider(id) {
  return registry.get(id);
}

/**
 * Lists all registered providers sorted by tier and priority.
 * @returns {Array<object>}
 */
export function listProviders() {
  return Array.from(registry.values()).sort((a, b) => (a.tier || 99) - (b.tier || 99));
}

/**
 * Clears the registry (useful for testing).
 */
export function clearRegistry() {
  registry.clear();
}
