import { Role, toUserId, User } from "@ody/domain/identity";
import { Email, Ok } from "@ody/domain/shared-kernel";
import { describe, expect, it, vi } from "vitest";

vi.mock("../auth/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

const userPassthrough = vi.hoisted(() => {
  return {
    requireAuth: async (
      c: {
        get: (k: string) => unknown;
        json: (b: unknown, s: number) => Response;
      },
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
  };
});

vi.mock("../auth/middleware.js", () => ({
  requireAuth: userPassthrough.requireAuth,
  requireRole: userPassthrough.requireRole,
  requireRestaurant: userPassthrough.requireRestaurant,
  requireMemberRole: userPassthrough.requireMemberRole,
  requireOrganization: userPassthrough.requireOrganization,
  requireOrgRole: userPassthrough.requireOrgRole,
}));

const findByIdMock = vi.fn();

vi.mock("../modules/identity/infrastructure/repositories.js", () => ({
  userRepository: {
    findById: (...args: unknown[]) => findByIdMock(...args),
    findByEmail: vi.fn(),
    save: vi.fn(),
  },
}));

const { buildTestApp } = await import("../test/build-test-app.js");
const { registerIdentityRoutes } = await import("./identity.js");

const TEST_USER_ID = "11111111-1111-4111-8111-111111111111";

const buildUser = (): User => {
  const emailR = Email.create("chef@example.com");
  if (!emailR.ok) throw new Error("bad email fixture");
  const r = User.create({
    id: toUserId(TEST_USER_ID),
    email: emailR.value,
    name: "Chef Test",
    role: Role.chef,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  });
  if (!r.ok) throw new Error("bad user fixture");
  return r.value;
};

describe("identity HTTP routes", () => {
  it("returns 401 when no auth user is set", async () => {
    const app = buildTestApp({ user: null, register: registerIdentityRoutes });
    const res = await app.request("/api/auth/me");
    expect(res.status).toBe(401);
    const body = (await res.json()) as { errors: Array<{ code: string }> };
    expect(body.errors[0]?.code).toBe("UNAUTHENTICATED");
  });

  it("returns the current user as JSON:API envelope with type 'users'", async () => {
    findByIdMock.mockResolvedValueOnce(Ok(buildUser()));
    const app = buildTestApp({
      user: {
        id: TEST_USER_ID,
        email: "chef@example.com",
        name: "Chef Test",
        role: "chef",
      },
      register: registerIdentityRoutes,
    });

    const res = await app.request("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = (await res.json()) as {
      data: { type: string; id: string; attributes: { email: string } };
    };
    expect(body.data.type).toBe("users");
    expect(body.data.id).toBe(TEST_USER_ID);
    expect(body.data.attributes.email).toBe("chef@example.com");
  });

  it("uses snake_case for created_at attribute", async () => {
    findByIdMock.mockResolvedValueOnce(Ok(buildUser()));
    const app = buildTestApp({
      user: {
        id: TEST_USER_ID,
        email: "chef@example.com",
        name: "Chef Test",
        role: "chef",
      },
      register: registerIdentityRoutes,
    });
    const res = await app.request("/api/auth/me");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { attributes: Record<string, unknown> };
    };
    expect(body.data.attributes).toHaveProperty("created_at");
    expect(typeof body.data.attributes.created_at).toBe("string");
    expect(body.data.attributes).not.toHaveProperty("createdAt");
  });
});
