import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import { Notification } from "../../domain/entities/notification.js";
import type { NotificationRepository } from "../../domain/repositories/notification.repository.js";
import type { NotificationType } from "../../domain/value-objects/notification-type.js";

export interface CreateNotificationDeps {
  notifications: NotificationRepository;
  generateId: () => string;
}

export interface CreateNotificationInput {
  restaurantId: string;
  type: NotificationType;
  title: string;
  data?: Record<string, unknown>;
}

export const createNotification = async (
  input: CreateNotificationInput,
  deps: CreateNotificationDeps,
): Promise<Result<Notification, DomainError>> => {
  const notification = Notification.create({
    id: deps.generateId(),
    type: input.type,
    title: input.title,
    data: input.data ?? {},
  });

  return deps.notifications.save(input.restaurantId, notification);
};

export const createNotificationAction = {
  execute: createNotification,
} as const;
