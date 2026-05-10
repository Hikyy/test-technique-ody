import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { ShowSettingsController } from "../modules/restaurant/infrastructure/http/controllers/show-settings.controller.js";
import { UpdateSettingsController } from "../modules/restaurant/infrastructure/http/controllers/update-settings.controller.js";
import { handle } from "../utils/controller.js";

export function buildSettingsRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth);
  sub.use("*", requireOrganization);
  sub.use("*", requireRestaurant);
  sub.get("/", ...handle(ShowSettingsController));
  sub.patch("/", ...handle(UpdateSettingsController));

  return sub;
}

export function registerSettingsRoutes(app: Hono<AppEnv>): void {
  app.route("/api/settings", buildSettingsRoutes());
}
