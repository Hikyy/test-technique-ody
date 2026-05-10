import { InvitationData } from "@ody/domain/restaurant";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { listPendingInvitations } from "../../../application/invitation.service.js";

export const IndexInvitationsController = {
  tag: "invitations",
  summary: "List pending invitations for the current restaurant",
  response: { collection: InvitationData.schema, description: "Pending invitations" },

  async __invoke({ context }) {
    const restaurantId = context.var.restaurant.restaurantId;
    const rows = await listPendingInvitations(restaurantId);

    const items = InvitationData.collect(
      rows.map((r) => ({
        id: r.id,
        restaurantId: r.restaurantId,
        email: r.email,
        role: r.role,
        expiresAt: r.expiresAt,
        acceptedAt: r.acceptedAt,
        createdAt: r.createdAt,
      })),
    );

    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length || 1,
    };
  },
} satisfies ControllerSpec;
