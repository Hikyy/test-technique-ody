import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../factory.js";

const buildApp = async () => {
  vi.resetModules();
  const { loginLimiter, destroyLimiter, globalApiLimiter } = await import("../middleware/rate-limit.js");
  const app = new Hono<AppEnv>();
  app.use("/login", loginLimiter);
  app.post("/login", (c) => c.json({ ok: true }, 401));
  app.use("/destroy", destroyLimiter);
  app.delete("/destroy", (c) => c.json({ ok: true }));
  app.use("/api/*", globalApiLimiter);
  app.get("/api/ping", (c) => c.json({ ok: true }));
  return app;
};

describe("rate limiting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows 5 login attempts then blocks the 6th with 429 + JSON:API body", async () => {
    const app = await buildApp();
    const headers = { "content-type": "application/json", "x-forwarded-for": "10.0.0.1" };
    const body = JSON.stringify({ email: "x", password: "y" });

    for (let i = 0; i < 5; i++) {
      const res = await app.request("/login", { method: "POST", headers, body });
      expect(res.status).toBe(401);
    }

    const blocked = await app.request("/login", { method: "POST", headers, body });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();

    const json = (await blocked.json()) as {
      errors: Array<{ status: string; code: string; title: string; detail: string }>;
    };
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0]?.status).toBe("429");
    expect(json.errors[0]?.code).toBe("RATE_LIMITED");
    expect(json.errors[0]?.title).toBe("Too Many Requests");
    expect(json.errors[0]?.detail).toMatch(/Try again in \d+ seconds/);
  });

  it("emits RateLimit-* draft-7 headers on allowed responses", async () => {
    const app = await buildApp();
    const res = await app.request("/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.2" },
      body: JSON.stringify({}),
    });
    expect(res.headers.get("RateLimit-Limit")).toBe("5");
    expect(res.headers.get("RateLimit-Remaining")).toBeTruthy();
    expect(res.headers.get("RateLimit-Reset")).toBeTruthy();
  });

  it("isolates buckets per IP — different IPs are not throttled together", async () => {
    const app = await buildApp();
    const body = JSON.stringify({});
    const headersA = { "content-type": "application/json", "x-forwarded-for": "10.0.0.10" };
    const headersB = { "content-type": "application/json", "x-forwarded-for": "10.0.0.11" };

    for (let i = 0; i < 5; i++) {
      await app.request("/login", { method: "POST", headers: headersA, body });
    }
    const blockedA = await app.request("/login", { method: "POST", headers: headersA, body });
    expect(blockedA.status).toBe(429);

    const okB = await app.request("/login", { method: "POST", headers: headersB, body });
    expect(okB.status).toBe(401);
  });

  it("resets bucket after the window elapses", async () => {
    const app = await buildApp();
    const headers = { "content-type": "application/json", "x-forwarded-for": "10.0.0.20" };
    const body = JSON.stringify({});

    for (let i = 0; i < 5; i++) {
      await app.request("/login", { method: "POST", headers, body });
    }
    const blocked = await app.request("/login", { method: "POST", headers, body });
    expect(blocked.status).toBe(429);

    vi.advanceTimersByTime(61_000);

    const recovered = await app.request("/login", { method: "POST", headers, body });
    expect(recovered.status).toBe(401);
  });
});
