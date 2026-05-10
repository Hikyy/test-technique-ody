import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { IndexNotificationsController } from "../modules/notification/infrastructure/http/controllers/index-notifications.controller.js";
import { MarkAllNotificationsReadController } from "../modules/notification/infrastructure/http/controllers/mark-all-notifications-read.controller.js";
import { MarkNotificationReadController } from "../modules/notification/infrastructure/http/controllers/mark-notification-read.controller.js";
import { handle } from "../utils/controller.js";

export function buildNotificationRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth);
  sub.use("*", requireOrganization);
  sub.use("*", requireRestaurant);
  sub.get("/", ...handle(IndexNotificationsController));
  sub.post("/mark-all-as-read", ...handle(MarkAllNotificationsReadController));
  sub.post("/:id/mark-as-read", ...handle(MarkNotificationReadController));

  return sub;
}

export function registerNotificationRoutes(app: Hono<AppEnv>): void {
  app.route("/api/notifications", buildNotificationRoutes());
}
