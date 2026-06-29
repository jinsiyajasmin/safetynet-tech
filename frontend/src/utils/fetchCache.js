const cache = new Map();

/**
 * Deduplicate and briefly cache async fetches (e.g. dashboard stats).
 * @param {string} key
 * @param {() => Promise<unknown>} fetcher
 * @param {{ ttlMs?: number }} [options]
 */
export async function fetchWithCache(key, fetcher, { ttlMs = 120_000 } = {}) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < ttlMs) {
    return hit.value;
  }
  if (hit?.promise) {
    return hit.promise;
  }

  const promise = fetcher()
    .then((value) => {
      cache.set(key, { value, at: Date.now(), promise: null });
      return value;
    })
    .catch((err) => {
      cache.delete(key);
      throw err;
    });

  cache.set(key, { ...(hit || {}), promise, at: hit?.at || 0 });
  return promise;
}

export function invalidateFetchCache(keyPrefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}
