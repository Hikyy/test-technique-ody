"use client";

import {
  getOrderIdFromNotification,
  type NotificationData,
  type NotificationType,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@ody/sdk";
import { Button, EmptyState, Skeleton } from "@ody/ui";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type Filter = "all" | "unread";

const ACCENT: Record<NotificationType, string> = {
  "order.created": "bg-accent",
  "order.status_changed": "bg-warn",
  "order.cancelled": "bg-neg",
  system: "bg-ink-3",
};

const TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

function formatRelative(iso: string, todayLabel: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();

  return sameDay ? `${todayLabel} · ${TIME.format(d)}` : `${DATE.format(d)} · ${TIME.format(d)}`;
}

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"] as const;

export function NotificationsPageClient() {
  const tNotifications = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const [filter, setFilter] = useState<Filter>("all");
  const list = useNotifications({ status: filter, pageSize: 50 });
  const markAll = useMarkAllNotificationsRead();
  const items = list.data?.items ?? [];
  const unread = (list.data?.meta as { unread?: number } | undefined)?.unread ?? 0;

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: ({ updated }) => toast.success(tNotifications("toastMarked", { n: updated })),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{tNotifications("eyebrow")}</div>
          <h1 className="mt-1.5 text-[28px] font-medium text-ink" style={{ letterSpacing: "-0.5px" }}>
            {tNotifications("title")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <FilterChip
            label={tNotifications("filters.all")}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label={unread > 0 ? tNotifications("filters.unreadCount", { n: unread }) : tNotifications("filters.unread")}
            active={filter === "unread"}
            onClick={() => setFilter("unread")}
          />
          {unread > 0 && (
            <Button variant="outline" onClick={handleMarkAll} disabled={markAll.isPending}>
              <CheckCheck className="size-3.5" aria-hidden />
              {markAll.isPending ? `${tCommon("loading")}` : tNotifications("markAll")}
            </Button>
          )}
        </div>
      </header>

      <section className="overflow-hidden rounded-card border border-line bg-surface">
        {list.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {SKELETON_KEYS.map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={<Bell className="size-6" aria-hidden />}
              title={filter === "unread" ? tNotifications("empty.allRead") : tNotifications("empty.title")}
              body={filter === "unread" ? tNotifications("empty.allReadBody") : tNotifications("empty.subtitle")}
            />
          </div>
        ) : (
          <ul className="flex flex-col">
            {items.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NotificationRow({ notification }: { notification: NotificationData }) {
  const tCommon = useTranslations("common");
  const a = notification.attributes;
  const orderId = getOrderIdFromNotification(notification);
  const dot = ACCENT[a.type];
  const markRead = useMarkNotificationRead();

  const handleClick = () => {
    if (!a.is_read) markRead.mutate({ id: notification.id });
  };

  const content = (
    <div
      className={`flex items-start gap-3 border-t border-line px-5 py-4 transition-colors first:border-t-0 hover:bg-accent-soft ${
        a.is_read ? "" : "bg-accent-soft/40"
      }`}
    >
      <span className={`mt-1.5 inline-block size-[10px] shrink-0 rounded-full ${dot}`} aria-hidden />

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="text-[14px] font-medium text-ink">{a.title}</div>
        <div className="font-mono text-[11px] text-ink-3">{formatRelative(a.created_at, tCommon("today"))}</div>
      </div>

      {!a.is_read && <span className="mt-2 inline-block size-[7px] shrink-0 rounded-full bg-accent" aria-hidden />}
    </div>
  );

  return (
    <li>
      {orderId ? (
        <Link href={`/orders/${orderId}`} onClick={handleClick} className="block">
          {content}
        </Link>
      ) : (
        <button type="button" onClick={handleClick} className="block w-full text-left">
          {content}
        </button>
      )}
    </li>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex h-9 items-center rounded-[10px] bg-ink px-3 text-[12.5px] font-medium text-bg transition-colors"
          : "inline-flex h-9 items-center rounded-[10px] border border-line bg-bg px-3 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-line-mid hover:text-ink"
      }
    >
      {label}
    </button>
  );
}
