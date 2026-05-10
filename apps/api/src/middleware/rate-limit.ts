import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import type { AppEnv } from "../factory.js";
import { createMiddleware } from "../factory.js";
import { loggerFor } from "../log.js";

interface Bucket {
  count: number;
  resetAt: number;
}

interface LimitConfig {
  windowMs: number;
  limit: number;
  keyPrefix: string;
  identifyBySession?: boolean;
}

const stores = new Map<string, Map<string, Bucket>>();
const CLEANUP_INTERVAL_MS = 60_000;

function getStore(prefix: string): Map<string, Bucket> {
  const existing = stores.get(prefix);

  if (existing) return existing;

  const next = new Map<string, Bucket>();

  stores.set(prefix, next);

  return next;
}

function purgeExpired(now: number): void {
  for (const store of stores.values()) {
    for (const [key, bucket] of store) {
      if (bucket.resetAt <= now) store.delete(key);
    }
  }
}

const cleanupTimer: NodeJS.Timeout | undefined =
  typeof setInterval === "function" ? setInterval(() => purgeExpired(Date.now()), CLEANUP_INTERVAL_MS) : undefined;

cleanupTimer?.unref?.();

function clientIp(c: Context<AppEnv>): string {
  const forwarded = c.req.header("x-forwarded-for");

  if (forwarded && forwarded.length > 0) {
    const first = forwarded.split(",")[0];

    if (first) return first.trim();
  }

  const realIp = c.req.header("x-real-ip");

  if (realIp && realIp.length > 0) return realIp.trim();

  try {
    const info = getConnInfo(c);

    if (info.remote?.address) return info.remote.address;
  } catch {
    // ignore — fall through to default
  }

  return "127.0.0.1";
}

function clientKey(c: Context<AppEnv>, identifyBySession: boolean): string {
  if (identifyBySession) {
    const user = c.get("user");

    if (user && typeof user.id === "string" && user.id.length > 0) {
      return `user:${user.id}`;
    }
  }

  return `ip:${clientIp(c)}`;
}

function setHeaders(c: Context<AppEnv>, limit: number, remaining: number, resetSec: number): void {
  c.header("RateLimit-Limit", String(limit));
  c.header("RateLimit-Remaining", String(Math.max(0, remaining)));
  c.header("RateLimit-Reset", String(Math.max(1, resetSec)));
  c.header("RateLimit-Policy", `${limit};w=${Math.ceil(resetSec)}`);
}

function tooManyRequests(c: Context<AppEnv>, retryAfter: number): Response {
  c.header("Retry-After", String(retryAfter));

  return c.json(
    {
      errors: [
        {
          status: "429",
          code: "RATE_LIMITED",
          title: "Too Many Requests",
          detail: `Try again in ${retryAfter} seconds`,
        },
      ],
    },
    429,
  );
}

function buildLimiter(cfg: LimitConfig) {
  const store = getStore(cfg.keyPrefix);

  return createMiddleware(async (c, next) => {
    const key = clientKey(c, cfg.identifyBySession ?? false);
    const now = Date.now();
    const bucket = store.get(key);

    if (!bucket || bucket.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + cfg.windowMs });
      setHeaders(c, cfg.limit, cfg.limit - 1, Math.ceil(cfg.windowMs / 1000));
      await next();

      return;
    }

    bucket.count += 1;
    const resetSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    if (bucket.count > cfg.limit) {
      setHeaders(c, cfg.limit, 0, resetSec);
      loggerFor(c).warn({ key, path: c.req.path, prefix: cfg.keyPrefix, retryAfter: resetSec }, "rate limited");

      return tooManyRequests(c, resetSec);
    }

    setHeaders(c, cfg.limit, cfg.limit - bucket.count, resetSec);
    await next();
  });
}

const ONE_MINUTE = 60_000;

export const loginLimiter = buildLimiter({
  windowMs: ONE_MINUTE,
  limit: 5,
  keyPrefix: "auth:login",
});

export const signUpLimiter = buildLimiter({
  windowMs: ONE_MINUTE,
  limit: 3,
  keyPrefix: "auth:signup",
});

export const passwordLimiter = buildLimiter({
  windowMs: ONE_MINUTE,
  limit: 3,
  keyPrefix: "auth:password",
});

export const globalApiLimiter = buildLimiter({
  windowMs: ONE_MINUTE,
  limit: 100,
  keyPrefix: "api:v1",
  identifyBySession: true,
});

export const destroyLimiter = buildLimiter({
  windowMs: ONE_MINUTE,
  limit: 30,
  keyPrefix: "api:v1:destroy",
  identifyBySession: true,
});

export const inviteAcceptLimiter = buildLimiter({
  windowMs: ONE_MINUTE,
  limit: 5,
  keyPrefix: "auth:invite-accept",
});

export const inviteLookupLimiter = buildLimiter({
  windowMs: ONE_MINUTE,
  limit: 20,
  keyPrefix: "auth:invite-lookup",
});
