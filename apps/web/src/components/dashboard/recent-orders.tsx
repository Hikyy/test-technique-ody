"use client";

import { Skeleton, StatusPill } from "@ody/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { OrderData, OrderStatus } from "@/lib/hooks/use-orders";

const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

const CURRENCY_FORMAT = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const SKELETON_KEYS = ["skel-1", "skel-2", "skel-3", "skel-4", "skel-5"] as const;

interface RecentOrdersProps {
  orders: OrderData[];
  isLoading: boolean;
}

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  const tRecentOrders = useTranslations("dashboard.recentOrders");

  return (
    <div className="rounded-card border border-line bg-surface px-5 pb-3 pt-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="text-[12px] text-ink-2">{tRecentOrders("title")}</div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-3 transition-colors hover:text-ink"
        >
          {tRecentOrders("viewAll")}
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>

      {isLoading ? <RecentOrdersSkeleton /> : <RecentOrdersList orders={orders} tRecentOrders={tRecentOrders} />}
    </div>
  );
}

function RecentOrdersSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {SKELETON_KEYS.map((key) => (
        <Skeleton key={key} className="h-9 w-full" />
      ))}
    </div>
  );
}

function RecentOrdersList({
  orders,
  tRecentOrders,
}: {
  orders: OrderData[];
  tRecentOrders: ReturnType<typeof useTranslations>;
}) {
  if (orders.length === 0) {
    return <div className="py-4 text-center font-serif text-[14px] italic text-ink-3">{tRecentOrders("empty")}</div>;
  }

  return (
    <div className="flex flex-col">
      {orders.map((o) => (
        <RecentOrderRow key={o.id} order={o} tableShort={tRecentOrders("tableShort")} />
      ))}
    </div>
  );
}

function RecentOrderRow({ order, tableShort }: { order: OrderData; tableShort: string }) {
  const a = order.attributes;
  const time = TIME_FORMAT.format(new Date(a.scheduled_at));
  const total = CURRENCY_FORMAT.format(a.total_cents / 100);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="-mx-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded border-t border-line px-2 py-2.5 transition-colors first:border-t-0 hover:bg-accent-soft"
    >
      <div className="font-mono text-[11.5px] text-ink-2">
        {tableShort}
        {a.table_number}
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <StatusPill status={a.status as OrderStatus} />
        <span className="shrink-0 font-mono text-[11px] text-ink-3">{time}</span>
      </div>

      <div className="font-mono text-[12.5px] font-medium text-ink">{total}</div>
    </Link>
  );
}
