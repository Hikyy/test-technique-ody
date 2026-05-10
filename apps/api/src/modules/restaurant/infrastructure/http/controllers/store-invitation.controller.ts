import { CreateInvitationDTO, CreateInvitationRequest, InvitationData } from "@ody/domain/restaurant";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { createInvitation } from "../../../application/invitation.service.js";

export const StoreInvitationController = {
  tag: "invitations",
  summary: "Create or refresh an invitation for the current restaurant",
  request: CreateInvitationRequest,
  response: { single: InvitationData.schema, status: 201, description: "Created" },

  async __invoke({ body, context }) {
    const dto = CreateInvitationDTO.fromRequest(body);
    const restaurantId = context.var.restaurant.restaurantId;
    const userId = context.var.user.id;

    const result = await createInvitation(restaurantId, dto.email, dto.role, userId);

    return InvitationData.fromModel({
      id: result.invitation.id,
      restaurantId: result.invitation.restaurantId,
      email: result.invitation.email,
      role: result.invitation.role,
      expiresAt: result.invitation.expiresAt,
      acceptedAt: result.invitation.acceptedAt,
      createdAt: result.invitation.createdAt,
      inviteUrl: result.inviteUrl,
    });
  },
} satisfies ControllerSpec;
