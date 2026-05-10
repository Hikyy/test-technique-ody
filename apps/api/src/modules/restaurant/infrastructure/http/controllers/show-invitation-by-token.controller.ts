import { Err, NotFoundError, Ok } from "@ody/domain/shared-kernel";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { findInvitationByPlainToken } from "../../../application/invitation.service.js";

const ShowInvitationByTokenSchema = z.object({
  type: z.literal("invitation-preview"),
  id: z.string(),
  attributes: z.object({
    email: z.string().email(),
    role: z.enum(["owner", "manager", "staff"]),
    restaurant_name: z.string(),
    expires_at: z.string().datetime(),
  }),
  relationships: z.object({}).strict(),
});

export const ShowInvitationByTokenController = {
  tag: "invitations",
  summary: "Public — preview an invitation by its token",
  errorSet: "minimal",
  params: z.object({ token: z.string().min(20) }),
  response: { single: ShowInvitationByTokenSchema, description: "Invitation preview" },

  async __invoke({ params }) {
    const lookup = await findInvitationByPlainToken(params.token);

    if (!lookup) return Err(new NotFoundError("Invitation", params.token));

    return Ok({
      type: "invitation-preview" as const,
      id: lookup.invitation.id,
      attributes: {
        email: lookup.invitation.email,
        role: lookup.invitation.role,
        restaurant_name: lookup.restaurantName,
        expires_at: lookup.invitation.expiresAt.toISOString(),
      },
      relationships: {},
    });
  },
} satisfies ControllerSpec;
