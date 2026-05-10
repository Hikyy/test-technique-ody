import { z } from "zod";
import type { Notification } from "../../domain/entities/notification.js";
import { notificationTypeSchema } from "../../domain/value-objects/notification-type.js";

export const notificationAttributesSchema = z.object({
  type: notificationTypeSchema,
  title: z.string(),
  data: z.record(z.string(), z.unknown()),
  read_at: z.string().datetime().nullable(),
  is_read: z.boolean(),
  created_at: z.string().datetime(),
});

export const notificationDataSchema = z.object({
  type: z.literal("notifications"),
  id: z.string().uuid(),
  attributes: notificationAttributesSchema,
});

export type NotificationDataType = z.infer<typeof notificationDataSchema>;

const toAttributes = (n: Notification): z.infer<typeof notificationAttributesSchema> => ({
  type: n.type,
  title: n.title,
  data: n.data,
  read_at: n.readAt ? n.readAt.toISOString() : null,
  is_read: n.isRead,
  created_at: n.createdAt.toISOString(),
});

const toNotificationData = (n: Notification): NotificationDataType => ({
  type: "notifications",
  id: n.id,
  attributes: toAttributes(n),
});

export const NotificationData = {
  schema: notificationDataSchema,
  fromModel: toNotificationData,
  collect: (ns: readonly Notification[]): NotificationDataType[] => ns.map(toNotificationData),
} as const;
