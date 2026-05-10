import { markAllNotificationsReadAction } from "@ody/domain/notification";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { notificationRepository } from "../../repositories.js";

const responseSchema = z.object({
  type: z.literal("notifications-bulk-mark-read"),
  id: z.string(),
  attributes: z.object({ updated: z.number().int().nonnegative() }),
});

export const MarkAllNotificationsReadController = {
  tag: "notifications",
  summary: "Mark all unread notifications as read",
  response: { single: responseSchema, description: "Bulk mark-read result" },

  async __invoke({ context }) {
    const result = await markAllNotificationsReadAction.execute(
      { restaurantId: context.var.restaurant.restaurantId },
      { notifications: notificationRepository },
    );

    if (!result.ok) return result;

    return {
      type: "notifications-bulk-mark-read" as const,
      id: "all",
      attributes: { updated: result.value.updated },
    };
  },
} satisfies ControllerSpec;
