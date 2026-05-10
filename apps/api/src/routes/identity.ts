import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { ShowCurrentUserController } from "../modules/identity/infrastructure/http/controllers/show-current-user.controller.js";
import { ShowUserController } from "../modules/identity/infrastructure/http/controllers/show-user.controller.js";
import { handle } from "../utils/controller.js";

export function buildIdentityRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.get("/auth/me", requireAuth, ...handle(ShowCurrentUserController));
  sub.get("/users/:id", requireAuth, requireRole("admin"), ...handle(ShowUserController));

  return sub;
}

export function registerIdentityRoutes(app: Hono<AppEnv>): void {
  app.route("/api", buildIdentityRoutes());
}
