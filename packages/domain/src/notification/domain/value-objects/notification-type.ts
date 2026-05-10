import { z } from "zod";

export const NOTIFICATION_TYPES = ["order.created", "order.status_changed", "order.cancelled", "system"] as const;

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
