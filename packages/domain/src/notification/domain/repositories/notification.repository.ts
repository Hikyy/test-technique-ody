import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { Notification } from "../entities/notification.js";
import type { NotificationId } from "../value-objects/notification-id.js";

export interface ListNotificationsFilters {
  restaurantId: string;
  status: "all" | "unread";
  page: number;
  pageSize: number;
}

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
}

export interface NotificationRepository {
  list(filters: ListNotificationsFilters): Promise<Result<PaginatedNotifications, DomainError>>;
  findById(restaurantId: string, id: NotificationId): Promise<Result<Notification | null, DomainError>>;
  save(restaurantId: string, notification: Notification): Promise<Result<Notification, DomainError>>;
  markAllRead(restaurantId: string, at: Date): Promise<Result<number, DomainError>>;
}
