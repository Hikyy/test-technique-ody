import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { NotificationRepository } from "../../domain/repositories/notification.repository.js";

export interface MarkAllNotificationsReadDeps {
  notifications: NotificationRepository;
}

export const markAllNotificationsRead = async (
  input: { restaurantId: string },
  deps: MarkAllNotificationsReadDeps,
): Promise<Result<{ updated: number }, DomainError>> => {
  const result = await deps.notifications.markAllRead(input.restaurantId, new Date());
  if (!result.ok) return result;

  return { ok: true, value: { updated: result.value } };
};

export const markAllNotificationsReadAction = {
  execute: markAllNotificationsRead,
} as const;
