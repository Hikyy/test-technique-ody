"use client";

import { Button, Skeleton, StatusPill } from "@ody/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCancelOrder } from "@/lib/hooks/use-cancel-order";
import { type ChangeOrderStatusVariables, useChangeOrderStatus } from "@/lib/hooks/use-change-order-status";
import { useOrder } from "@/lib/hooks/use-order";
import type { OrderStatus } from "@/lib/hooks/use-orders";
import { findCustomer, resolveOrderLines } from "@/lib/json-api-included";

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; tKey: string }>> = {
  pending: { next: "cooking", tKey: "statuses.cooking" },
  cooking: { next: "sent", tKey: "statuses.sent" },
  sent: { next: "served", tKey: "statuses.served" },
};

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
  } catch {
    return "—";
  }
}

interface OrderDetailFullPageProps {
  orderId: string;
}

export function OrderDetailFullPage({ orderId }: OrderDetailFullPageProps) {
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const { data: envelope, isLoading, isError } = useOrder(orderId);
  const change = useChangeOrderStatus();
  const cancel = useCancelOrder();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-[140px] w-full" />
        <Skeleton className="h-[260px] w-full" />
      </div>
    );
  }

  if (isError || !envelope) {
    return <div className="rounded-card border border-line bg-surface p-6 text-[13px] text-neg">{tCommon("back")}</div>;
  }

  const order = envelope.data;
  const included = envelope.included;
  const a = order.attributes;
  const lines = resolveOrderLines(order.relationships.lines.data, included);
  const customerRef = order.relationships.customer.data;
  const customer = customerRef ? findCustomer(included, customerRef.id) : undefined;
  const advance = NEXT_STATUS[a.status];

  const handleAdvance = (vars: ChangeOrderStatusVariables) =>
    change.mutate(vars, {
      onSuccess: () => toast.success(tOrders("updated")),
      onError: (err) => toast.error(err.message),
    });

  const handleCancel = () => {
    if (!confirm(tOrders("confirmCancel"))) return;
    cancel.mutate(
      { id: order.id },
      {
        onSuccess: () => toast.success(tOrders("cancelled")),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2 transition-colors hover:text-ink"
      >
        <svg
          className="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>{" "}
        {tOrders("title")}
      </Link>

      <header className="flex items-end justify-between rounded-card border border-line bg-surface px-6 py-5">
        <div>
          <div className="font-mono text-[11.5px] text-accent">
            #{order.id.slice(0, 8)} · T.{String(a.table_number).padStart(2, "0")}
          </div>
          <h1 className="mt-1 font-serif text-[28px] italic text-ink">
            {tOrders("title")} · {lines.length} {lines.length > 1 ? "articles" : "article"}
          </h1>
          <div className="mt-1 font-mono text-[12px] text-ink-2">{formatTime(a.scheduled_at)}</div>
        </div>
        <StatusPill status={a.status} />
      </header>

      {customer && (
        <section className="flex items-baseline justify-between rounded-card border border-line bg-surface px-6 py-4">
          <div>
            <div className="text-[14px] font-medium text-ink">
              {customer.attributes.last_name} {customer.attributes.first_name}
            </div>
            {customer.attributes.phone && (
              <div className="font-mono text-[12px] text-ink-2">{customer.attributes.phone}</div>
            )}
          </div>
          <div className="text-right font-mono text-[12px] text-ink-3">
            {customer.attributes.visits_count} visites ·{" "}
            {formatPrice(customer.attributes.spent_cents, customer.attributes.currency)}
          </div>
        </section>
      )}

      <section className="rounded-card border border-line bg-surface p-6">
        <ul className="flex flex-col">
          {lines.map((l) => (
            <li
              key={l.id}
              className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-0"
            >
              <span className="text-[14px] text-ink">
                <span className="font-mono text-ink-2">{l.qty}×</span> {l.dishName}
              </span>
              <span className="font-mono text-[13px] text-ink-2">{formatPrice(l.lineTotalCents, l.currency)}</span>
            </li>
          ))}
        </ul>
      </section>

      {a.notes && (
        <section className="rounded-card border border-line bg-surface p-5 font-serif text-[14px] italic leading-[1.55] text-ink-2">
          « {a.notes} »
        </section>
      )}

      <section className="flex flex-col rounded-card border border-line bg-surface p-6">
        <div className="flex items-baseline justify-between">
          <div className="text-[13px] font-medium text-ink">{tOrders("total")}</div>
          <div className="font-mono text-[18px] font-medium text-ink">{formatPrice(a.total_cents, a.currency)}</div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {advance && (
          <Button
            variant="ink"
            disabled={change.isPending}
            onClick={() => handleAdvance({ id: order.id, status: advance.next })}
          >
            {`${tOrders("actions.changeStatus")} → ${tOrders(advance.tKey as "statuses.cooking")}`}
          </Button>
        )}
        {a.status !== "cancelled" && a.status !== "served" && (
          <Button variant="outline" disabled={cancel.isPending} onClick={handleCancel}>
            {tOrders("actions.cancel")}
          </Button>
        )}
      </section>
    </div>
  );
}
