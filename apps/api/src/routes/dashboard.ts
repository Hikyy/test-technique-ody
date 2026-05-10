import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { cacheMiddleware } from "../middleware/cache.js";
import { ShowDashboardOverviewController } from "../modules/dashboard/infrastructure/http/controllers/show-dashboard-overview.controller.js";
import { streamOrders } from "../modules/dashboard/infrastructure/http/controllers/stream-orders.controller.js";
import { handle } from "../utils/controller.js";

const THIRTY_SECONDS_MS = 30_000;

export function buildDashboardRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth);
  sub.use("*", requireOrganization);
  sub.use("*", requireRestaurant);
  sub.get(
    "/overview",
    cacheMiddleware({ ttlMs: THIRTY_SECONDS_MS, keyPrefix: "dashboard:overview" }),
    ...handle(ShowDashboardOverviewController),
  );
  sub.get("/stream", ...streamOrders.handlers);

  return sub;
}

export function registerDashboardRoutes(app: Hono<AppEnv>): void {
  app.route("/api/dashboard", buildDashboardRoutes());
}
