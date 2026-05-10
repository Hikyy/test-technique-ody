"use client";

import { Button, Modal, ModalContent, Skeleton, StatusPill } from "@ody/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useCancelOrder } from "@/lib/hooks/use-cancel-order";
import { type ChangeOrderStatusVariables, useChangeOrderStatus } from "@/lib/hooks/use-change-order-status";
import { useOrder } from "@/lib/hooks/use-order";
import type { OrderData, OrderIncludedResource, OrderStatus } from "@/lib/hooks/use-orders";
import { findCustomer, resolveOrderLines } from "@/lib/json-api-included";

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; tKey: string }>> = {
  pending: { next: "cooking", tKey: "statuses.cooking" },
  cooking: { next: "sent", tKey: "statuses.sent" },
  sent: { next: "served", tKey: "statuses.served" },
};

const DETAIL_SKELETON_KEYS = ["a", "b", "c", "d", "e"] as const;

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

interface OrderDetailRailProps {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDetailRail({ orderId, onClose }: OrderDetailRailProps) {
  const open = Boolean(orderId);
  return (
    <Modal open={open} onOpenChange={(v: boolean) => (v ? null : onClose())}>
      <ModalContent variant="side-rail" className="overflow-y-auto p-0">
        {orderId ? <RailBody orderId={orderId} onClose={onClose} /> : null}
      </ModalContent>
    </Modal>
  );
}

function RailBody({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const tOrders = useTranslations("orders");
  const { data: envelope, isLoading, isError } = useOrder(orderId);
  const change = useChangeOrderStatus();
  const cancel = useCancelOrder();

  if (isLoading) return <RailSkeleton />;
  if (isError || !envelope) {
    return (
      <RailFrame>
        <p className="text-[13px] text-neg">Impossible de charger la commande.</p>
      </RailFrame>
    );
  }

  const order: OrderData = envelope.data;
  const included: readonly OrderIncludedResource[] = envelope.included;
  const a = order.attributes;
  const lines = resolveOrderLines(order.relationships.lines.data, included);
  const customerRef = order.relationships.customer.data;
  const customer = customerRef ? findCustomer(included, customerRef.id) : undefined;
  const advance = NEXT_STATUS[a.status];

  const handleAdvance = (vars: ChangeOrderStatusVariables) => {
    change.mutate(vars, {
      onSuccess: () => toast.success(tOrders("updated")),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleCancel = () => {
    if (!confirm(tOrders("confirmCancel"))) return;
    cancel.mutate(
      { id: order.id },
      {
        onSuccess: () => {
          toast.success(tOrders("cancelled"));
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <RailFrame>
      <header className="flex items-baseline justify-between">
        <div className="font-mono text-[11.5px] text-accent">
          #{order.id.slice(0, 8)} · T.{String(a.table_number).padStart(2, "0")}
        </div>
        <StatusPill status={a.status} />
      </header>

      <h2 className="font-serif text-[24px] italic leading-[1.15] tracking-[-0.3px] text-ink">
        {tOrders("title")} · {lines.length} {lines.length > 1 ? "articles" : "article"}
      </h2>
      <div className="text-[12px] text-ink-2">{formatTime(a.scheduled_at)}</div>

      {customer && (
        <div className="rounded-card border border-line bg-bg p-3">
          <div className="text-[13px] font-medium text-ink">
            {customer.attributes.last_name} {customer.attributes.first_name}
          </div>
          {customer.attributes.phone && (
            <div className="font-mono text-[11.5px] text-ink-2">{customer.attributes.phone}</div>
          )}
          <div className="mt-1 font-mono text-[11px] text-ink-3">
            {customer.attributes.visits_count} visites ·{" "}
            {formatPrice(customer.attributes.spent_cents, customer.attributes.currency)} dépensés
          </div>
        </div>
      )}

      <ul className="flex flex-col">
        {lines.map((l) => (
          <li key={l.id} className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-0">
            <span className="text-[13px] text-ink">
              <span className="font-mono text-ink-2">{l.qty}×</span> {l.dishName}
            </span>
            <span className="font-mono text-[12.5px] text-ink-2">{formatPrice(l.lineTotalCents, l.currency)}</span>
          </li>
        ))}
      </ul>

      {a.notes && (
        <div className="rounded-card border border-line bg-bg p-3 font-serif text-[12.5px] italic leading-[1.5] text-ink-2">
          « {a.notes} »
        </div>
      )}

      <div className="flex items-baseline justify-between border-t border-line-mid pt-3">
        <div className="text-[13px] font-medium text-ink">{tOrders("total")}</div>
        <div className="font-mono text-[17px] font-medium text-ink">{formatPrice(a.total_cents, a.currency)}</div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        {advance && (
          <Button
            variant="ink"
            disabled={change.isPending}
            onClick={() => handleAdvance({ id: order.id, status: advance.next })}
          >
            {change.isPending
              ? "…"
              : `${tOrders("actions.changeStatus")} → ${tOrders(advance.tKey as "statuses.cooking")}`}
          </Button>
        )}
        {a.status !== "cancelled" && a.status !== "served" && (
          <Button variant="outline" disabled={cancel.isPending} onClick={handleCancel}>
            {tOrders("actions.cancel")}
          </Button>
        )}
      </div>
    </RailFrame>
  );
}

function RailFrame({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col gap-3 p-6">{children}</div>;
}

function RailSkeleton() {
  return (
    <RailFrame>
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-3.5 w-2/3" />
      <div className="flex flex-col gap-2 pt-3">
        {DETAIL_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-4 w-full" />
        ))}
      </div>
      <Skeleton className="mt-3 h-9 w-full" />
    </RailFrame>
  );
}

export type { OrderData };
