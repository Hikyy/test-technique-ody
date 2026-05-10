import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireMemberRole, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { CompleteOnboardingController } from "../modules/onboarding/infrastructure/http/controllers/complete-onboarding.controller.js";
import { SeedRestaurantController } from "../modules/onboarding/infrastructure/http/controllers/seed-restaurant.controller.js";
import { ShowOnboardingStatusController } from "../modules/onboarding/infrastructure/http/controllers/show-onboarding-status.controller.js";
import { handle } from "../utils/controller.js";

export function buildOnboardingRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  // Status — every authenticated member can read (used by route guards).
  sub.get("/status", requireAuth, requireOrganization, requireRestaurant, ...handle(ShowOnboardingStatusController));

  // Seed + complete — owner-only mutations during the wizard.
  sub.post(
    "/seed",
    requireAuth,
    requireOrganization,
    requireRestaurant,
    requireMemberRole("owner"),
    ...handle(SeedRestaurantController),
  );
  sub.post(
    "/complete",
    requireAuth,
    requireOrganization,
    requireRestaurant,
    requireMemberRole("owner"),
    ...handle(CompleteOnboardingController),
  );

  return sub;
}

export function registerOnboardingRoutes(app: Hono<AppEnv>): void {
  app.route("/api/onboarding", buildOnboardingRoutes());
}
