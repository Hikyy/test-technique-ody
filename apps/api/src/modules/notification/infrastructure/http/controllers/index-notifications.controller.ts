import {
  ListNotificationsFiltersDTO,
  ListNotificationsRequest,
  listNotificationsAction,
  NotificationData,
} from "@ody/domain/notification";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { notificationRepository } from "../../repositories.js";

export const IndexNotificationsController = {
  tag: "notifications",
  summary: "List notifications (paginated, optionally filtered by status)",
  query: ListNotificationsRequest,
  response: {
    collection: NotificationData.schema,
    description: "Paginated notification list",
  },

  async __invoke({ query, context }) {
    const filters = ListNotificationsFiltersDTO.fromRequest(query);

    const result = await listNotificationsAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, filters },
      { notifications: notificationRepository },
    );

    if (!result.ok) return result;

    return {
      items: NotificationData.collect(result.value.items),
      total: result.value.total,
      page: result.value.page,
      pageSize: result.value.pageSize,
      meta: { unread: result.value.unread },
    };
  },
} satisfies ControllerSpec;
