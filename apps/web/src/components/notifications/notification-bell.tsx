"use client";

import { useUnreadNotificationsCount } from "@ody/sdk";
import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationBell() {
  const unread = useUnreadNotificationsCount();

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
      className="relative inline-flex size-9 items-center justify-center rounded-[8px] text-ink-2 transition-colors hover:bg-accent-soft hover:text-ink"
    >
      <Bell className="size-[18px]" aria-hidden />
      {unread > 0 && (
        <span className="absolute right-1 top-1 grid min-w-[16px] h-[16px] place-items-center rounded-full bg-accent px-1 font-mono text-[9.5px] font-medium text-bg">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
