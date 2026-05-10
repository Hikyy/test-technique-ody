import { markNotificationReadAction, NotificationData, toNotificationId } from "@ody/domain/notification";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { notificationRepository } from "../../repositories.js";

const ParamsSchema = z.object({ id: z.string().uuid() });

export const MarkNotificationReadController = {
  tag: "notifications",
  summary: "Mark a single notification as read",
  params: ParamsSchema,
  response: { single: NotificationData.schema, description: "Notification marked as read" },

  async __invoke({ params, context }) {
    const notification = await markNotificationReadAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, id: toNotificationId(params.id) },
      { notifications: notificationRepository },
    );

    if (!notification.ok) return notification;

    return NotificationData.fromModel(notification.value);
  },
} satisfies ControllerSpec;
