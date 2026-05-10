import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { destroyLimiter } from "../middleware/rate-limit.js";
import { UploadDishImageController } from "../modules/storage/upload-dish-image.controller.js";
import { handle } from "../utils/controller.js";

export function buildUploadsRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth);
  sub.use("*", requireOrganization);
  sub.use("*", requireRestaurant);
  sub.post("/dishes", destroyLimiter, ...handle(UploadDishImageController));

  return sub;
}

export function registerUploadsRoutes(app: Hono<AppEnv>): void {
  app.route("/api/uploads", buildUploadsRoutes());
}
