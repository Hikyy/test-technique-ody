import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireAuth, requireMemberRole, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";
import { destroyLimiter, inviteAcceptLimiter, inviteLookupLimiter } from "../middleware/rate-limit.js";
import { AcceptInvitationController } from "../modules/restaurant/infrastructure/http/controllers/accept-invitation.controller.js";
import { DestroyInvitationController } from "../modules/restaurant/infrastructure/http/controllers/destroy-invitation.controller.js";
import { IndexInvitationsController } from "../modules/restaurant/infrastructure/http/controllers/index-invitations.controller.js";
import { ShowInvitationByTokenController } from "../modules/restaurant/infrastructure/http/controllers/show-invitation-by-token.controller.js";
import { StoreInvitationController } from "../modules/restaurant/infrastructure/http/controllers/store-invitation.controller.js";
import { handle } from "../utils/controller.js";

export function buildInvitationRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  // Public endpoints — used by the accept-invite flow before the user has a session.
  sub.get("/by-token/:token", inviteLookupLimiter, ...handle(ShowInvitationByTokenController));
  sub.post("/accept", inviteAcceptLimiter, ...handle(AcceptInvitationController));

  // Owner-only management endpoints.
  sub.get(
    "/",
    requireAuth,
    requireOrganization,
    requireRestaurant,
    requireMemberRole("owner"),
    ...handle(IndexInvitationsController),
  );
  sub.post(
    "/",
    requireAuth,
    requireOrganization,
    requireRestaurant,
    requireMemberRole("owner"),
    ...handle(StoreInvitationController),
  );
  sub.delete(
    "/:id",
    destroyLimiter,
    requireAuth,
    requireOrganization,
    requireRestaurant,
    requireMemberRole("owner"),
    ...handle(DestroyInvitationController),
  );

  return sub;
}

export function registerInvitationRoutes(app: Hono<AppEnv>): void {
  app.route("/api/invitations", buildInvitationRoutes());
}
