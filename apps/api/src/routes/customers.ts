import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { destroyLimiter } from "../middleware/rate-limit.js";
import { DestroyCustomerController } from "../modules/customer/infrastructure/http/controllers/destroy-customer.controller.js";
import { IndexCustomersController } from "../modules/customer/infrastructure/http/controllers/index-customers.controller.js";
import { ShowCustomerController } from "../modules/customer/infrastructure/http/controllers/show-customer.controller.js";
import { StoreCustomerController } from "../modules/customer/infrastructure/http/controllers/store-customer.controller.js";
import { UpdateCustomerController } from "../modules/customer/infrastructure/http/controllers/update-customer.controller.js";
import { handle } from "../utils/controller.js";

export function buildCustomerRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth);
  sub.use("*", requireOrganization);
  sub.use("*", requireRestaurant);
  sub.get("/", ...handle(IndexCustomersController));
  sub.post("/", ...handle(StoreCustomerController));
  sub.get("/:id", ...handle(ShowCustomerController));
  sub.patch("/:id", ...handle(UpdateCustomerController));
  sub.delete("/:id", destroyLimiter, ...handle(DestroyCustomerController));

  return sub;
}

export function registerCustomerRoutes(app: Hono<AppEnv>): void {
  app.route("/api/customers", buildCustomerRoutes());
}
