import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";
import type { ApiList, JsonApiMeta } from "../types";

export type NotificationType = "order.created" | "order.status_changed" | "order.cancelled" | "system";

export interface NotificationAttributes {
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationData {
  type: "notifications";
  id: string;
  attributes: NotificationAttributes;
}

export interface NotificationListMeta extends JsonApiMeta {
  unread?: number;
}

export interface NotificationsQuery {
  status?: "all" | "unread";
  page?: number;
  pageSize?: number;
}

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (q: NotificationsQuery) => ["notifications", q] as const,
};

export function useNotifications(query: NotificationsQuery = {}) {
  const client = useApiClient();

  return useQuery({
    queryKey: notificationsKeys.list(query),
    queryFn: () =>
      client.apiList<NotificationData>("/api/notifications", {
        query: { status: query.status, page: query.page, pageSize: query.pageSize },
      }),
    staleTime: 15_000,
  });
}

export function useUnreadNotificationsCount(): number {
  const list = useNotifications({ status: "unread", pageSize: 1 });
  const meta = list.data?.meta as NotificationListMeta | undefined;

  return meta?.unread ?? meta?.total ?? 0;
}

export function useMarkNotificationRead() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<NotificationData, Error, { id: string }>({
    mutationFn: ({ id }) => client.apiPost<NotificationData>(`/api/notifications/${id}/mark-as-read`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<{ updated: number }, Error, void>({
    mutationFn: async () => {
      const data = await client.apiPost<{
        type: "notifications-bulk-mark-read";
        id: string;
        attributes: { updated: number };
      }>("/api/notifications/mark-all-as-read");

      return { updated: data.attributes.updated };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}

export function isOrderRelated(n: NotificationData): boolean {
  return n.attributes.type !== "system";
}

export function getOrderIdFromNotification(n: NotificationData): string | null {
  const orderId = n.attributes.data.orderId;

  return typeof orderId === "string" ? orderId : null;
}

export type ApiNotificationsList = ApiList<NotificationData>;
