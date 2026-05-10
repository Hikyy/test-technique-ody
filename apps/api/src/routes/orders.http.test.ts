import { toDishId } from "@ody/domain/catalog";
import { Order, OrderLine, OrderStatus, toOrderId } from "@ody/domain/ordering";
import { Money, Ok } from "@ody/domain/shared-kernel";
import { describe, expect, it, vi } from "vitest";

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

const orderRepo = {
  findById: vi.fn(),
  list: vi.fn(),
  save: vi.fn(),
};

const customerRepo = {
  findById: vi.fn().mockResolvedValue({ ok: true, value: null }),
  findByIds: vi.fn().mockResolvedValue({ ok: true, value: [] }),
  list: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

const dishRepo = {
  findById: vi.fn().mockResolvedValue({ ok: true, value: null }),
  findByIds: vi.fn().mockResolvedValue({ ok: true, value: [] }),
  list: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../modules/ordering/infrastructure/repositories.js", () => ({
  orderRepository: orderRepo,
  orderingDeps: {
    orders: orderRepo,
    customers: customerRepo,
    dishes: dishRepo,
    clock: { now: () => new Date("2026-05-08T19:00:00Z") },
  },
}));

const { buildTestApp } = await import("../test/build-test-app.js");
const { registerOrderRoutes } = await import("./orders.js");

const ORDER_ID = "33333333-3333-4333-8333-333333333333";
const DISH_ID = "44444444-4444-4444-8444-444444444444";

const buildOrder = (status: OrderStatus = OrderStatus.pending): Order => {
  const lineR = OrderLine.create({
    dishId: toDishId(DISH_ID),
    qty: 2,
    unitPrice: Money.fromCents(1500),
  });
  if (!lineR.ok) throw new Error("bad line fixture");
  const now = new Date("2026-05-08T19:00:00Z");
  return Order.restore({
    id: toOrderId(ORDER_ID),
    tableNumber: 5,
    status,
    customerId: null,
    scheduledAt: new Date("2026-05-08T20:00:00Z"),
    lines: [lineR.value],
    notes: null,
    createdAt: now,
    updatedAt: now,
  });
};

const makeApp = () => buildTestApp({ register: registerOrderRoutes });

describe("orders HTTP routes", () => {
  it("lists orders as a JSON:API collection", async () => {
    orderRepo.list.mockResolvedValue(Ok({ items: [], total: 0, page: 1, pageSize: 20 }));
    const res = await makeApp().request("/api/orders");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: unknown[];
      included: unknown[];
      meta: { total: number };
    };
    expect(body.data).toEqual([]);
    expect(body.included).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  it("includes deduplicated lines + dish refs in the orders list", async () => {
    orderRepo.list.mockResolvedValue(Ok({ items: [buildOrder()], total: 1, page: 1, pageSize: 20 }));
    dishRepo.findByIds.mockResolvedValue({ ok: true, value: [] });
    customerRepo.findByIds.mockResolvedValue({ ok: true, value: [] });
    const res = await makeApp().request("/api/orders");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: Array<{ relationships: { lines: { data: Array<{ id: string }> } } }>;
      included: Array<{ type: string; id: string }>;
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.relationships.lines.data.length).toBeGreaterThanOrEqual(1);
    const types = body.included.map((i) => i.type);
    expect(types).toContain("order-lines");
    const keys = body.included.map((i) => `${i.type}:${i.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns 400 when body has empty lines (DTO requires min 1)", async () => {
    const res = await makeApp().request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_number: 5,
        scheduled_at: "2026-05-08T20:00:00Z",
        lines: [],
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { errors: Array<{ code: string }> };
    expect(body.errors[0]?.code).toBe("VALIDATION_ERROR");
  });

  it("creates an order (201) with valid lines", async () => {
    orderRepo.save.mockResolvedValue(Ok(undefined));
    const res = await makeApp().request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_number: 5,
        scheduled_at: "2026-05-08T20:00:00Z",
        lines: [{ dish_id: DISH_ID, qty: 2, unit_price_cents: 1500 }],
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      data: { type: string; attributes: { total_cents: number; status: string } };
    };
    expect(body.data.type).toBe("orders");
    expect(body.data.attributes.total_cents).toBe(3000);
    expect(body.data.attributes.status).toBe("pending");
  });

  it("returns 422 INVALID_TRANSITION on illegal status change", async () => {
    orderRepo.findById.mockResolvedValue(Ok(buildOrder(OrderStatus.served)));
    const res = await makeApp().request(`/api/orders/${ORDER_ID}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cooking" }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { errors: Array<{ code: string }> };
    expect(body.errors[0]?.code).toBe("INVALID_TRANSITION");
  });

  it("transitions order to a valid next status (200)", async () => {
    orderRepo.findById.mockResolvedValue(Ok(buildOrder(OrderStatus.pending)));
    orderRepo.save.mockResolvedValue(Ok(undefined));
    const res = await makeApp().request(`/api/orders/${ORDER_ID}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cooking" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { attributes: { status: string } };
    };
    expect(body.data.attributes.status).toBe("cooking");
  });
});
