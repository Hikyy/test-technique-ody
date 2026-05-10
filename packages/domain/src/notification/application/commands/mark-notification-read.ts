import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import { Err, type Result } from "../../../shared-kernel/result.js";
import type { Notification } from "../../domain/entities/notification.js";
import type { NotificationRepository } from "../../domain/repositories/notification.repository.js";
import type { NotificationId } from "../../domain/value-objects/notification-id.js";

export interface MarkNotificationReadDeps {
  notifications: NotificationRepository;
}

export const markNotificationRead = async (
  input: { restaurantId: string; id: NotificationId },
  deps: MarkNotificationReadDeps,
): Promise<Result<Notification, DomainError>> => {
  const found = await deps.notifications.findById(input.restaurantId, input.id);
  if (!found.ok) return found;
  if (!found.value) return Err(new NotFoundError("Notification", input.id));

  return deps.notifications.save(input.restaurantId, found.value.markRead());
};

export const markNotificationReadAction = {
  execute: markNotificationRead,
} as const;
