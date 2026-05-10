import { Category, Dish, toCategoryId, toDishId } from "@ody/domain/catalog";
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

const categoryRepoMock = {
  findById: vi.fn(),
  list: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

const dishRepoMock = {
  findById: vi.fn(),
  list: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../modules/catalog/infrastructure/repositories.js", () => ({
  categoryRepository: categoryRepoMock,
  dishRepository: dishRepoMock,
}));

const { buildTestApp } = await import("../test/build-test-app.js");
const { registerMenuRoutes } = await import("./menu.js");

const CATEGORY_ID = "55555555-5555-4555-8555-555555555555";
const DISH_ID = "66666666-6666-4666-8666-666666666666";

const buildCategory = (): Category => {
  const r = Category.create({ id: toCategoryId(CATEGORY_ID), name: "Entrées", position: 1 });
  if (!r.ok) throw new Error("bad cat fixture");
  return r.value;
};

const buildDish = (available = true): Dish => {
  const r = Dish.create({
    id: toDishId(DISH_ID),
    categoryId: toCategoryId(CATEGORY_ID),
    name: "Bœuf Bourguignon",
    description: null,
    price: Money.fromCents(2400),
    available,
    imageUrl: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  });
  if (!r.ok) throw new Error("bad dish fixture");
  return r.value;
};

const makeApp = () => buildTestApp({ register: registerMenuRoutes });

describe("menu HTTP routes", () => {
  it("lists categories (200)", async () => {
    categoryRepoMock.list.mockResolvedValue(Ok([buildCategory()]));
    const res = await makeApp().request("/api/menu/categories");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: Array<{ type: string; attributes: { name: string } }>;
    };
    expect(body.data[0]?.type).toBe("categories");
    expect(body.data[0]?.attributes.name).toBe("Entrées");
  });

  it("lists dishes with snake_case price_cents and category relationship", async () => {
    dishRepoMock.list.mockResolvedValue(Ok({ items: [buildDish()], total: 1, page: 1, pageSize: 20 }));
    const res = await makeApp().request("/api/menu/dishes");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: Array<{
        attributes: { price_cents: number };
        relationships: { category: { data: { type: string; id: string } } };
      }>;
    };
    expect(body.data[0]?.attributes.price_cents).toBe(2400);
    expect(body.data[0]?.relationships.category.data.id).toBe(CATEGORY_ID);
    expect(body.data[0]?.relationships.category.data.type).toBe("categories");
  });

  it("creates a dish (201)", async () => {
    dishRepoMock.save.mockResolvedValue(Ok(undefined));
    const res = await makeApp().request("/api/menu/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: CATEGORY_ID,
        name: "Soupe à l'oignon",
        price_cents: 950,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      data: { type: string; attributes: { name: string; price_cents: number } };
    };
    expect(body.data.type).toBe("dishes");
    expect(body.data.attributes.name).toBe("Soupe à l'oignon");
    expect(body.data.attributes.price_cents).toBe(950);
  });

  it("toggles dish availability (200) and flips the boolean", async () => {
    const dish = buildDish(true);
    dishRepoMock.findById.mockResolvedValue(Ok(dish));
    dishRepoMock.save.mockResolvedValue(Ok(undefined));
    const res = await makeApp().request(`/api/menu/dishes/${DISH_ID}/toggle-availability`, { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { attributes: { available: boolean } };
    };
    expect(body.data.attributes.available).toBe(false);
  });

  it("deletes a dish (204)", async () => {
    dishRepoMock.delete.mockResolvedValue(Ok(undefined));
    const res = await makeApp().request(`/api/menu/dishes/${DISH_ID}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(204);
    expect(dishRepoMock.delete).toHaveBeenCalled();
  });
});
