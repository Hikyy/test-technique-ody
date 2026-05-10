import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { cacheMiddleware } from "../middleware/cache.js";
import { destroyLimiter } from "../middleware/rate-limit.js";
import { DestroyDishController } from "../modules/catalog/infrastructure/http/controllers/destroy-dish.controller.js";
import { IndexCategoriesController } from "../modules/catalog/infrastructure/http/controllers/index-categories.controller.js";
import { IndexDishesController } from "../modules/catalog/infrastructure/http/controllers/index-dishes.controller.js";
import { StoreCategoryController } from "../modules/catalog/infrastructure/http/controllers/store-category.controller.js";
import { StoreDishController } from "../modules/catalog/infrastructure/http/controllers/store-dish.controller.js";
import { ToggleDishAvailabilityController } from "../modules/catalog/infrastructure/http/controllers/toggle-dish-availability.controller.js";
import { UpdateDishController } from "../modules/catalog/infrastructure/http/controllers/update-dish.controller.js";
import { handle } from "../utils/controller.js";

const SIXTY_SECONDS_MS = 60_000;

export function buildMenuRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth);
  sub.use("*", requireOrganization);
  sub.use("*", requireRestaurant);
  sub.get(
    "/categories",
    cacheMiddleware({ ttlMs: SIXTY_SECONDS_MS, keyPrefix: "menu:categories" }),
    ...handle(IndexCategoriesController),
  );
  sub.get(
    "/dishes",
    cacheMiddleware({ ttlMs: SIXTY_SECONDS_MS, keyPrefix: "menu:dishes" }),
    ...handle(IndexDishesController),
  );
  sub.post("/categories", ...handle(StoreCategoryController));
  sub.post("/dishes", ...handle(StoreDishController));
  sub.patch("/dishes/:id", ...handle(UpdateDishController));
  sub.post("/dishes/:id/toggle-availability", ...handle(ToggleDishAvailabilityController));
  sub.delete("/dishes/:id", destroyLimiter, ...handle(DestroyDishController));

  return sub;
}

export function registerMenuRoutes(app: Hono<AppEnv>): void {
  app.route("/api/menu", buildMenuRoutes());
}
