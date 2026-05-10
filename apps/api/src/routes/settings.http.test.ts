import { OpeningHours, RestaurantSettings } from "@ody/domain/restaurant";
import { Ok } from "@ody/domain/shared-kernel";
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

const settingsRepoMock = {
  get: vi.fn(),
  save: vi.fn(),
};

vi.mock("../modules/restaurant/infrastructure/repositories.js", () => ({
  settingsRepository: settingsRepoMock,
}));

const { buildTestApp } = await import("../test/build-test-app.js");
const { registerSettingsRoutes } = await import("./settings.js");

const buildSettings = (): RestaurantSettings => {
  const hoursR = OpeningHours.create({
    monday: { openAt: "09:00", closeAt: "22:00" },
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null,
  });
  if (!hoursR.ok) throw new Error("bad hours fixture");
  const r = RestaurantSettings.create({
    name: "La Cantine",
    address: "1 rue de la Paix, Paris",
    openingHours: hoursR.value,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
  if (!r.ok) throw new Error("bad settings fixture");
  return r.value;
};

const makeApp = () => buildTestApp({ register: registerSettingsRoutes });

describe("settings HTTP routes", () => {
  it("returns 200 with JSON:API single envelope (type 'restaurant-settings', id 'current')", async () => {
    settingsRepoMock.get.mockResolvedValue(Ok(buildSettings()));
    const res = await makeApp().request("/api/settings");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { type: string; id: string; attributes: { name: string } };
    };
    expect(body.data.type).toBe("restaurant-settings");
    expect(body.data.id).toBe("current");
    expect(body.data.attributes.name).toBe("La Cantine");
  });

  it("updates settings with a partial patch (200)", async () => {
    settingsRepoMock.get.mockResolvedValue(Ok(buildSettings()));
    settingsRepoMock.save.mockResolvedValue(Ok(undefined));
    const res = await makeApp().request("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Nouveau Nom" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { attributes: { name: string } };
    };
    expect(body.data.attributes.name).toBe("Nouveau Nom");
  });

  it("rejects invalid opening_hours with 400 or 422", async () => {
    settingsRepoMock.get.mockResolvedValue(Ok(buildSettings()));
    const res = await makeApp().request("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opening_hours: {
          monday: { open_at: "99:99", close_at: "22:00" },
          tuesday: null,
          wednesday: null,
          thursday: null,
          friday: null,
          saturday: null,
          sunday: null,
        },
      }),
    });
    expect([400, 422]).toContain(res.status);
  });
});
