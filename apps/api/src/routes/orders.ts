import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { destroyLimiter } from "../middleware/rate-limit.js";
import { CancelOrderController } from "../modules/ordering/infrastructure/http/controllers/cancel-order.controller.js";
import { ChangeOrderStatusController } from "../modules/ordering/infrastructure/http/controllers/change-order-status.controller.js";
import { IndexOrdersController } from "../modules/ordering/infrastructure/http/controllers/index-orders.controller.js";
import { ShowOrderController } from "../modules/ordering/infrastructure/http/controllers/show-order.controller.js";
import { StoreOrderController } from "../modules/ordering/infrastructure/http/controllers/store-order.controller.js";
import { handle } from "../utils/controller.js";

export function buildOrderRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth);
  sub.use("*", requireOrganization);
  sub.use("*", requireRestaurant);
  sub.get("/", ...handle(IndexOrdersController));
  sub.post("/", ...handle(StoreOrderController));
  sub.get("/:id", ...handle(ShowOrderController));
  sub.patch("/:id/status", ...handle(ChangeOrderStatusController));
  sub.post("/:id/cancel", destroyLimiter, ...handle(CancelOrderController));

  return sub;
}

export function registerOrderRoutes(app: Hono<AppEnv>): void {
  app.route("/api/orders", buildOrderRoutes());
}
