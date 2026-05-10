import { Customer, toCustomerId } from "@ody/domain/customer";
import { Email, Err, NotFoundError, Ok, PhoneNumber } from "@ody/domain/shared-kernel";
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

const repo = {
  findById: vi.fn(),
  list: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../modules/customer/infrastructure/repositories.js", () => ({
  customerRepository: repo,
}));

const { buildTestApp } = await import("../test/build-test-app.js");
const { registerCustomerRoutes } = await import("./customers.js");

const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

const buildCustomer = (): Customer => {
  const emailR = Email.create("lea@seve.fr");
  if (!emailR.ok) throw new Error("bad email fixture");
  const phoneR = PhoneNumber.create("06 12 34 56 78");
  if (!phoneR.ok) throw new Error("bad phone fixture");
  const r = Customer.create({
    id: toCustomerId(CUSTOMER_ID),
    firstName: "Léa",
    lastName: "Dupont",
    email: emailR.value,
    phone: phoneR.value,
    notes: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  });
  if (!r.ok) throw new Error("bad customer fixture");
  return r.value;
};

const makeApp = () => buildTestApp({ register: registerCustomerRoutes });

describe("customers HTTP routes", () => {
  it("returns an empty paginated collection envelope", async () => {
    repo.list.mockResolvedValueOnce(Ok({ items: [], total: 0, page: 1, pageSize: 20 }));
    const res = await makeApp().request("/api/customers");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: unknown[];
      meta: { total: number; page: number; pageSize: number };
      links: { self: string; next: string | null; prev: string | null };
    };
    expect(body.data).toEqual([]);
    expect(body.meta).toEqual({ total: 0, page: 1, pageSize: 20 });
    expect(body.links.self).toContain("/api/customers");
    expect(body.links.next).toBeNull();
    expect(body.links.prev).toBeNull();
  });

  it("returns customers with snake_case attributes", async () => {
    repo.list.mockResolvedValueOnce(Ok({ items: [buildCustomer()], total: 1, page: 1, pageSize: 20 }));
    const res = await makeApp().request("/api/customers");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: Array<{
        type: string;
        id: string;
        attributes: { first_name: string; last_name: string; email: string };
      }>;
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.type).toBe("customers");
    expect(body.data[0]?.attributes.first_name).toBe("Léa");
    expect(body.data[0]?.attributes.last_name).toBe("Dupont");
  });

  it("creates a customer (201) returning a JSON:API single envelope", async () => {
    repo.save.mockResolvedValueOnce(Ok(undefined));
    const res = await makeApp().request("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: "Marie",
        last_name: "Curie",
        phone: "06 12 34 56 78",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      data: { type: string; attributes: { first_name: string; phone: string | null } };
    };
    expect(body.data.type).toBe("customers");
    expect(body.data.attributes.first_name).toBe("Marie");
    expect(body.data.attributes.phone).toBe("+33612345678");
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it("returns 400 with VALIDATION_ERROR on invalid body (missing names)", async () => {
    const res = await makeApp().request("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { errors: Array<{ code: string }> };
    expect(body.errors[0]?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when getting a missing customer", async () => {
    repo.findById.mockResolvedValueOnce(Err(new NotFoundError("Customer", CUSTOMER_ID)));
    const res = await makeApp().request(`/api/customers/${CUSTOMER_ID}`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { errors: Array<{ code: string }> };
    expect(body.errors[0]?.code).toBe("NOT_FOUND");
  });
});
