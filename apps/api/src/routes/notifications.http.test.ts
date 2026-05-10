import { Notification, toNotificationId } from "@ody/domain/notification";
import { Err, NotFoundError, Ok } from "@ody/domain/shared-kernel";
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
  list: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  markAllRead: vi.fn(),
};

vi.mock("../modules/notification/infrastructure/repositories.js", () => ({
  notificationRepository: repo,
}));

const { buildTestApp } = await import("../test/build-test-app.js");
const { registerNotificationRoutes } = await import("./notifications.js");

const NOTIF_ID = "33333333-3333-4333-8333-333333333333";

const buildNotification = (overrides: { readAt?: Date | null } = {}): Notification =>
  Notification.restore({
    id: toNotificationId(NOTIF_ID),
    type: "order.created",
    title: "Nouvelle commande · table 5",
    body: null,
    data: { orderId: "abc-123", tableNumber: 5, status: "pending" },
    readAt: overrides.readAt ?? null,
    createdAt: new Date("2026-05-09T10:00:00Z"),
  });

const makeApp = () => buildTestApp({ register: registerNotificationRoutes });

describe("notifications HTTP routes", () => {
  it("lists notifications with unread meta", async () => {
    repo.list.mockResolvedValueOnce(Ok({ items: [buildNotification()], total: 1, unread: 1, page: 1, pageSize: 20 }));
    const res = await makeApp().request("/api/notifications");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: Array<{ type: string; id: string; attributes: { is_read: boolean; type: string } }>;
      meta: { total: number; unread: number };
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.type).toBe("notifications");
    expect(body.data[0]?.attributes.is_read).toBe(false);
    expect(body.data[0]?.attributes.type).toBe("order.created");
    expect(body.meta.unread).toBe(1);
  });

  it("filters by status=unread", async () => {
    repo.list.mockResolvedValueOnce(Ok({ items: [], total: 0, unread: 0, page: 1, pageSize: 20 }));
    const res = await makeApp().request("/api/notifications?status=unread");
    expect(res.status).toBe(200);
    expect(repo.list).toHaveBeenCalledWith(expect.objectContaining({ status: "unread" }));
  });

  it("returns 401 when unauthenticated", async () => {
    const app = buildTestApp({ user: null, register: registerNotificationRoutes });
    const res = await app.request("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("marks a single notification as read", async () => {
    const unread = buildNotification();
    const read = buildNotification({ readAt: new Date("2026-05-09T11:00:00Z") });
    repo.findById.mockResolvedValueOnce(Ok(unread));
    repo.save.mockResolvedValueOnce(Ok(read));
    const res = await makeApp().request(`/api/notifications/${NOTIF_ID}/mark-as-read`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { type: string; id: string; attributes: { is_read: boolean; read_at: string | null } };
    };
    expect(body.data.attributes.is_read).toBe(true);
    expect(body.data.attributes.read_at).not.toBeNull();
  });

  it("returns 404 when notification not found", async () => {
    repo.findById.mockResolvedValueOnce(Err(new NotFoundError("Notification", NOTIF_ID)));
    const res = await makeApp().request(`/api/notifications/${NOTIF_ID}/mark-as-read`, {
      method: "POST",
    });
    expect(res.status).toBe(404);
  });

  it("marks all notifications as read", async () => {
    repo.markAllRead.mockResolvedValueOnce(Ok(7));
    const res = await makeApp().request("/api/notifications/mark-all-as-read", {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { type: string; attributes: { updated: number } };
    };
    expect(body.data.type).toBe("notifications-bulk-mark-read");
    expect(body.data.attributes.updated).toBe(7);
  });
});
