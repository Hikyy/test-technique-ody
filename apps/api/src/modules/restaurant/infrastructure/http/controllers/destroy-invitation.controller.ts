import { Err, NotFoundError, Ok } from "@ody/domain/shared-kernel";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { revokeInvitation } from "../../../application/invitation.service.js";

export const DestroyInvitationController = {
  tag: "invitations",
  summary: "Revoke a pending invitation",
  params: z.object({ id: z.string().uuid() }),
  response: { noContent: true },

  async __invoke({ params, context }) {
    const ok = await revokeInvitation(context.var.restaurant.restaurantId, params.id);

    if (!ok) return Err(new NotFoundError("Invitation", params.id));

    return Ok(undefined);
  },
} satisfies ControllerSpec;
