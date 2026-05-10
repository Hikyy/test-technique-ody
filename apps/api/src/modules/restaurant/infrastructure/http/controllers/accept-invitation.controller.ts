import { AcceptInvitationDTO, AcceptInvitationRequest } from "@ody/domain/restaurant";
import { ConflictError, Err, Ok, ValidationError } from "@ody/domain/shared-kernel";
import { z } from "zod";
import { auth } from "../../../../../auth/auth.js";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { acceptInvitation } from "../../../application/invitation.service.js";

const AcceptInvitationResponseSchema = z.object({
  type: z.literal("invitation-acceptance"),
  id: z.string(),
  attributes: z.object({
    user_id: z.string(),
    restaurant_id: z.string(),
  }),
  relationships: z.object({}).strict(),
});

export const AcceptInvitationController = {
  tag: "invitations",
  summary: "Public — accept an invitation and join the restaurant",
  errorSet: "minimal",
  request: AcceptInvitationRequest,
  response: { single: AcceptInvitationResponseSchema, status: 201, description: "Accepted" },

  async __invoke({ body, context }) {
    const existing = await auth.api.getSession({ headers: context.req.raw.headers });

    if (existing?.user) {
      return Err(
        new ConflictError(
          "An active session is present. Sign out before accepting an invitation to avoid identity collision.",
        ),
      );
    }

    const dto = AcceptInvitationDTO.fromRequest(body);
    const result = await acceptInvitation(dto);

    if ("error" in result) {
      return Err(new ValidationError(`Invitation cannot be accepted: ${result.error}`));
    }

    return Ok({
      type: "invitation-acceptance" as const,
      id: result.userId,
      attributes: {
        user_id: result.userId,
        restaurant_id: result.restaurantId,
      },
      relationships: {},
    });
  },
} satisfies ControllerSpec;
