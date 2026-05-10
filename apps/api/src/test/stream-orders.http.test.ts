import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/auth.js", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

const userPassthrough = vi.hoisted(() => ({
  requireAuth: async (
    c: { get: (k: string) => unknown; json: (b: unknown, s: number) => Response },
    next: () => Promise<void>,
  ) => {
    const u = c.get("user");
    if (!u) {
      return c.json({ errors: [{ status: "401", code: "UNAUTHENTICATED", title: "Unauthorized" }] }, 401);
    }
    await next();
  },
  requireRole: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  requireRestaurant: async (
    c: { set: (k: string, v: unknown) => void; get: (k: string) => unknown },
    next: () => Promise<void>,
  ) => {
    if (c.get("user")) {
      c.set("restaurant", {
        restaurantId: "00000000-0000-4000-8000-0000000000bb",
        role: "owner",
      });
    }
    await next();
  },
  requireMemberRole: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  requireOrganization: async (
    c: { set: (k: string, v: unknown) => void; get: (k: string) => unknown },
    next: () => Promise<void>,
  ) => {
    if (c.get("user")) {
      c.set("organization", {
        organizationId: "00000000-0000-4000-8000-0000000000cc",
        role: "owner",
      });
    }
    await next();
  },
  requireOrgRole: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

vi.mock("../auth/middleware.js", () => ({
  requireAuth: userPassthrough.requireAuth,
  requireRole: userPassthrough.requireRole,
  requireRestaurant: userPassthrough.requireRestaurant,
  requireMemberRole: userPassthrough.requireMemberRole,
  requireOrganization: userPassthrough.requireOrganization,
  requireOrgRole: userPassthrough.requireOrgRole,
}));

vi.mock("@ody/db/client", () => ({
  db: { select: vi.fn(() => ({})) },
  pool: {},
  closeDb: vi.fn(),
  schema: {},
}));

vi.mock("@ody/db/schema", () => ({
  orders: {},
  orderLines: {},
  dishes: {},
}));

const { buildTestApp } = await import("./build-test-app.js");
const { streamOrders } = await import(
  "../modules/dashboard/infrastructure/http/controllers/stream-orders.controller.js"
);
const { eventBus } = await import("../utils/event-bus.js");

interface AppLike {
  get: (path: string, ...handlers: ReadonlyArray<unknown>) => unknown;
  request: (input: string, init?: RequestInit) => Promise<Response>;
}

const makeApp = (): AppLike => {
  const app = buildTestApp({
    register: (a) => {
      const handlers = streamOrders.handlers as ReadonlyArray<Parameters<typeof a.get>[1]>;
      a.get(streamOrders.path, ...handlers);
    },
  }) as unknown as AppLike;
  return app;
};

const readChunk = async (reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder): Promise<string> => {
  const { value, done } = await reader.read();
  if (done || !value) return "";
  return decoder.decode(value);
};

describe("SSE /api/dashboard/stream", () => {
  afterEach(() => {
    eventBus.removeAllListeners("order:created");
    eventBus.removeAllListeners("order:status-changed");
  });

  it("returns 200 with text/event-stream content-type and SSE headers", async () => {
    const ctrl = new AbortController();
    const res = await makeApp().request("/api/dashboard/stream", {
      method: "GET",
      signal: ctrl.signal,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    expect(res.headers.get("Cache-Control")).toContain("no-cache");
    expect(res.headers.get("X-Accel-Buffering")).toBe("no");
    ctrl.abort();
    if (res.body) {
      const reader = res.body.getReader();
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
    }
  });

  it("emits an initial 'ready' event and propagates 'order-created' events", async () => {
    const ctrl = new AbortController();
    const res = await makeApp().request("/api/dashboard/stream", {
      method: "GET",
      signal: ctrl.signal,
    });
    expect(res.status).toBe(200);
    if (!res.body) throw new Error("missing SSE body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    const ready = await readChunk(reader, decoder);
    expect(ready).toContain("event: ready");
    expect(ready).toContain("id: 1");
    expect(ready).toContain("data: ");

    eventBus.emit("order:created", {
      restaurantId: "00000000-0000-4000-8000-0000000000bb",
      orderId: "11111111-1111-4111-8111-111111111111",
      tableNumber: 7,
      status: "pending",
    });

    const created = await readChunk(reader, decoder);
    expect(created).toContain("event: order-created");
    expect(created).toContain("id: 2");
    expect(created).toContain('"orderId":"11111111-1111-4111-8111-111111111111"');
    expect(created).toContain('"tableNumber":7');

    ctrl.abort();
    try {
      await reader.cancel();
    } catch {
      // ignore
    }
  });

  it("cleans up event-bus listeners after the stream is cancelled", async () => {
    const before = eventBus.listenerCount("order:created");
    const ctrl = new AbortController();
    const res = await makeApp().request("/api/dashboard/stream", {
      method: "GET",
      signal: ctrl.signal,
    });
    if (!res.body) throw new Error("missing SSE body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    await readChunk(reader, decoder);
    expect(eventBus.listenerCount("order:created")).toBe(before + 1);

    ctrl.abort();
    try {
      await reader.cancel();
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 20));
    expect(eventBus.listenerCount("order:created")).toBeLessThanOrEqual(before + 1);
  });
});
