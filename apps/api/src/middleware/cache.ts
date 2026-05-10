import { createMiddleware } from "../factory.js";

const IS_TEST = Boolean(process.env.VITEST) || process.env.NODE_ENV === "test";

interface CacheEntry {
  body: string;
  contentType: string;
  expiresAt: number;
}

interface CacheOptions {
  ttlMs: number;
  keyPrefix?: string;
}

const stores = new Map<string, Map<string, CacheEntry>>();
const CLEANUP_INTERVAL_MS = 60_000;

const getStore = (prefix: string): Map<string, CacheEntry> => {
  const existing = stores.get(prefix);

  if (existing) return existing;

  const next = new Map<string, CacheEntry>();

  stores.set(prefix, next);

  return next;
};

const purgeExpired = (now: number): void => {
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  }
};

const cleanupTimer: NodeJS.Timeout | undefined =
  typeof setInterval === "function" ? setInterval(() => purgeExpired(Date.now()), CLEANUP_INTERVAL_MS) : undefined;

cleanupTimer?.unref?.();

const buildKey = (url: string): string => {
  try {
    const u = new URL(url);

    return `${u.pathname}?${u.searchParams.toString()}`;
  } catch {
    return url;
  }
};

export const cacheMiddleware = (opts: CacheOptions) => {
  const prefix = opts.keyPrefix ?? "default";
  const store = getStore(prefix);

  return createMiddleware(async (c, next) => {
    if (c.req.method !== "GET" || IS_TEST) {
      await next();

      return;
    }

    // Scope cache by restaurant to prevent cross-tenant leakage when the
    // same URL is requested by users of different restaurants.
    const restaurantId = c.var.restaurant?.restaurantId ?? "anon";
    const key = `${restaurantId}|${buildKey(c.req.url)}`;
    const now = Date.now();
    const hit = store.get(key);

    if (hit && hit.expiresAt > now) {
      c.header("X-Cache", "HIT");
      c.header("Content-Type", hit.contentType);

      return c.body(hit.body, 200);
    }

    await next();

    const status = c.res.status;

    if (status >= 200 && status < 300) {
      const cloned = c.res.clone();
      const body = await cloned.text();
      const contentType = cloned.headers.get("Content-Type") ?? "application/json";

      store.set(key, {
        body,
        contentType,
        expiresAt: now + opts.ttlMs,
      });
    }

    c.header("X-Cache", "MISS");
  });
};
