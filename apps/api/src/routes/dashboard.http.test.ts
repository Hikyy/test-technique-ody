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

const dailyAggRows: { rows: unknown[] } = { rows: [] };
const topPlatsRows: { rows: unknown[] } = { rows: [] };

const queryCounter = vi.hoisted(() => ({ count: 0 }));

const makeChain = (data: unknown[]): unknown => {
  const target: Record<string | symbol, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for Drizzle query chains
    then: (resolve: (v: unknown[]) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(data).then(resolve, reject),
    catch: (reject: (e: unknown) => unknown) => Promise.resolve(data).catch(reject),
    finally: (cb: () => void) => Promise.resolve(data).finally(cb),
  };
  return new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      return () => makeChain(data);
    },
  });
};

vi.mock("@ody/db/client", () => ({
  db: {
    select: vi.fn(() => {
      queryCounter.count += 1;
      const data = queryCounter.count === 1 ? dailyAggRows.rows : topPlatsRows.rows;
      return makeChain(data);
    }),
  },
  pool: {},
  closeDb: vi.fn(),
  schema: {},
}));

vi.mock("@ody/db/schema", () => ({
  orders: {
    id: "orders.id",
    status: "orders.status",
    createdAt: "orders.createdAt",
    totalCents: "orders.totalCents",
  },
  orderLines: {
    orderId: "orderLines.orderId",
    dishId: "orderLines.dishId",
    qty: "orderLines.qty",
    unitPriceCents: "orderLines.unitPriceCents",
  },
  dishes: {
    id: "dishes.id",
    name: "dishes.name",
  },
}));

const { buildTestApp } = await import("../test/build-test-app.js");
const { registerDashboardRoutes } = await import("./dashboard.js");

const makeApp = () => buildTestApp({ register: registerDashboardRoutes });

describe("dashboard HTTP routes", () => {
  it("returns 200 with snake_case overview attributes including top_plats", async () => {
    queryCounter.count = 0;
    dailyAggRows.rows = [];
    topPlatsRows.rows = [
      {
        dishId: "dish-1",
        name: "Tarte Tatin",
        qty: 12,
        revenueCents: 24000,
      },
    ];

    const res = await makeApp().request("/api/dashboard/overview");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        type: string;
        id: string;
        attributes: {
          couverts_du_jour: { value: number };
          top_plats: Array<{ dish_id: string; name: string }>;
        };
      };
    };
    expect(body.data.type).toBe("dashboard-overview");
    expect(body.data.id).toBe("current");
    expect(body.data.attributes.couverts_du_jour).toHaveProperty("value");
    expect(body.data.attributes.top_plats[0]?.dish_id).toBe("dish-1");
    expect(body.data.attributes.top_plats[0]?.name).toBe("Tarte Tatin");
  });

  it("returns 200 with all KPI values at 0 when there is no data", async () => {
    queryCounter.count = 0;
    dailyAggRows.rows = [];
    topPlatsRows.rows = [];

    const res = await makeApp().request("/api/dashboard/overview");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        attributes: {
          couverts_du_jour: { value: number };
          ca_estime: { value: number };
          panier_moyen: { value: number };
          taux_annulation: { value: number };
          top_plats: unknown[];
        };
      };
    };
    expect(body.data.attributes.couverts_du_jour.value).toBe(0);
    expect(body.data.attributes.ca_estime.value).toBe(0);
    expect(body.data.attributes.panier_moyen.value).toBe(0);
    expect(body.data.attributes.taux_annulation.value).toBe(0);
    expect(body.data.attributes.top_plats).toEqual([]);
  });
});
