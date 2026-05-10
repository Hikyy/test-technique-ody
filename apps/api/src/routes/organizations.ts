import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireOrgRole } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { IndexOrgRestaurantsController } from "../modules/organization/infrastructure/http/controllers/index-org-restaurants.controller.js";
import { IndexOrganizationsController } from "../modules/organization/infrastructure/http/controllers/index-organizations.controller.js";
import { StoreOrgRestaurantController } from "../modules/organization/infrastructure/http/controllers/store-org-restaurant.controller.js";
import { StoreOrganizationController } from "../modules/organization/infrastructure/http/controllers/store-organization.controller.js";
import { handle } from "../utils/controller.js";

export function buildOrganizationRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth);

  sub.get("/", ...handle(IndexOrganizationsController));
  sub.post("/", ...handle(StoreOrganizationController));

  sub.get("/:organizationId/restaurants", requireOrganization, ...handle(IndexOrgRestaurantsController));
  sub.post(
    "/:organizationId/restaurants",
    requireOrganization,
    requireOrgRole("owner", "admin"),
    ...handle(StoreOrgRestaurantController),
  );

  return sub;
}

export function registerOrganizationRoutes(app: Hono<AppEnv>): void {
  app.route("/api/organizations", buildOrganizationRoutes());
}
