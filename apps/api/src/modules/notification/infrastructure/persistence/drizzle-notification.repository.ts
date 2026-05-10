import { db } from "@ody/db/client";
import { notifications } from "@ody/db/schema";
import {
  type ListNotificationsFilters,
  NOTIFICATION_TYPES,
  Notification,
  type NotificationId,
  type NotificationRepository,
  type NotificationType,
  type PaginatedNotifications,
  toNotificationId,
} from "@ody/domain/notification";
import type { DomainError, Result } from "@ody/domain/shared-kernel";
import { and, desc, eq, isNull, type SQL, sql } from "drizzle-orm";
import { runQuery } from "../../../shared/run-query.js";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  data: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

const isKnownType = (t: string): t is NotificationType => (NOTIFICATION_TYPES as readonly string[]).includes(t);

const rowToNotification = (row: NotificationRow): Notification =>
  Notification.restore({
    id: toNotificationId(row.id),
    type: isKnownType(row.type) ? row.type : "system",
    title: row.title,
    data: row.data ?? {},
    readAt: row.readAt,
    createdAt: row.createdAt,
  });

export class DrizzleNotificationRepository implements NotificationRepository {
  list(filters: ListNotificationsFilters): Promise<Result<PaginatedNotifications, DomainError>> {
    return runQuery(async () => {
      const offset = (filters.page - 1) * filters.pageSize;
      const tenantWhere: SQL = eq(notifications.restaurantId, filters.restaurantId);
      const where: SQL =
        filters.status === "unread" ? (and(tenantWhere, isNull(notifications.readAt)) as SQL) : tenantWhere;

      const itemsQuery = db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(filters.pageSize)
        .offset(offset);

      const totalQuery = db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(where);

      const unreadQuery = db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(tenantWhere, isNull(notifications.readAt)));

      const [rows, totalRows, unreadRows] = await Promise.all([itemsQuery, totalQuery, unreadQuery]);

      return {
        items: rows.map((r) => rowToNotification(r as NotificationRow)),
        total: totalRows[0]?.count ?? 0,
        unread: unreadRows[0]?.count ?? 0,
        page: filters.page,
        pageSize: filters.pageSize,
      };
    });
  }

  findById(restaurantId: string, id: NotificationId): Promise<Result<Notification | null, DomainError>> {
    return runQuery(async () => {
      const rows = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.restaurantId, restaurantId), eq(notifications.id, id)))
        .limit(1);
      const r = rows[0];

      return r ? rowToNotification(r as NotificationRow) : null;
    });
  }

  save(restaurantId: string, notification: Notification): Promise<Result<Notification, DomainError>> {
    return runQuery(async () => {
      const row = {
        id: notification.id,
        restaurantId,
        type: notification.type,
        title: notification.title,
        data: notification.data,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      };

      await db
        .insert(notifications)
        .values(row)
        .onConflictDoUpdate({
          target: notifications.id,
          setWhere: eq(notifications.restaurantId, restaurantId),
          set: { readAt: row.readAt, data: row.data, title: row.title },
        });

      return notification;
    });
  }

  markAllRead(restaurantId: string, at: Date): Promise<Result<number, DomainError>> {
    return runQuery(async () => {
      const result = await db
        .update(notifications)
        .set({ readAt: at })
        .where(and(eq(notifications.restaurantId, restaurantId), isNull(notifications.readAt)))
        .returning({ id: notifications.id });

      return result.length;
    });
  }
}

export const notificationRepository = new DrizzleNotificationRepository();
