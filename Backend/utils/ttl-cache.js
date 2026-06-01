const stores = new Map();

const getStore = (namespace) => {
  if (!stores.has(namespace)) {
    stores.set(namespace, new Map());
  }

  return stores.get(namespace);
};

const getCacheValue = (namespace, key) => {
  const store = getStore(namespace);
  const entry = store.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  return entry.value;
};

const setCacheValue = (namespace, key, value, ttlMs) => {
  getStore(namespace).set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });

  return value;
};

const getOrSetCache = async (namespace, key, ttlMs, resolver) => {
  const cachedValue = getCacheValue(namespace, key);

  if (cachedValue) {
    return {
      value: cachedValue,
      cacheStatus: "hit",
    };
  }

  const value = await resolver();
  setCacheValue(namespace, key, value, ttlMs);

  return {
    value,
    cacheStatus: "miss",
  };
};

module.exports = {
  getCacheValue,
  setCacheValue,
  getOrSetCache,
};
