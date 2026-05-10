import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type {
  NotificationRepository,
  PaginatedNotifications,
} from "../../domain/repositories/notification.repository.js";
import type { ListNotificationsFiltersDTO } from "../../interface/dto/notification.dto.js";

export interface ListNotificationsDeps {
  notifications: NotificationRepository;
}

export const listNotifications = async (
  input: { restaurantId: string; filters: ListNotificationsFiltersDTO },
  deps: ListNotificationsDeps,
): Promise<Result<PaginatedNotifications, DomainError>> => {
  return deps.notifications.list({
    restaurantId: input.restaurantId,
    status: input.filters.status,
    page: input.filters.page,
    pageSize: input.filters.pageSize,
  });
};

export const listNotificationsAction = {
  execute: listNotifications,
} as const;
