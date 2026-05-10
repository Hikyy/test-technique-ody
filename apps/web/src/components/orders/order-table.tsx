"use client";

import { Button, DataTable, type DataTableColumn, EmptyState, StatusPill } from "@ody/ui";
import { useTranslations } from "next-intl";
import type { OrderData, OrderIncludedResource } from "@/lib/hooks/use-orders";
import { findCustomer, resolveOrderLines } from "@/lib/json-api-included";

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

function describeLines(order: OrderData, included: readonly OrderIncludedResource[]): string {
  const lines = resolveOrderLines(order.relationships.lines.data, included);
  if (lines.length === 0) return "—";
  const visible = lines.slice(0, 3).map((l) => `${l.qty}× ${l.dishName}`);
  const extra = lines.length - 3;
  return extra > 0 ? `${visible.join(" · ")} +${extra}` : visible.join(" · ");
}

function totalCovers(order: OrderData, included: readonly OrderIncludedResource[]): number {
  const lines = resolveOrderLines(order.relationships.lines.data, included);
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

function customerLabel(order: OrderData, included: readonly OrderIncludedResource[]): string {
  const ref = order.relationships.customer.data;
  if (!ref) return "—";
  const c = findCustomer(included, ref.id);
  if (!c) return "—";
  const last = c.attributes.last_name?.trim();
  const first = c.attributes.first_name?.trim();
  if (!last && !first) return "—";
  return [last, first].filter(Boolean).join(" ");
}

export type OrderRow = OrderData;

interface OrderTableProps {
  rows: OrderData[];
  included: readonly OrderIncludedResource[];
  isLoading: boolean;
  selectedId: string | null;
  onRowClick: (row: OrderData) => void;
  onCreateClick: () => void;
}

export function OrderTable({ rows, included, isLoading, selectedId, onRowClick, onCreateClick }: OrderTableProps) {
  const tOrders = useTranslations("orders");

  const columns: DataTableColumn<OrderData>[] = [
    {
      key: "time",
      header: tOrders("scheduledAt"),
      className: "w-[72px]",
      render: (row) => (
        <span className="font-mono text-[12px] text-ink-2">{formatTime(row.attributes.scheduled_at)}</span>
      ),
    },
    {
      key: "table",
      header: tOrders("table"),
      className: "w-[72px]",
      render: (row) => (
        <span className="font-mono text-[12px] text-accent">
          T.{String(row.attributes.table_number).padStart(2, "0")}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Client",
      className: "w-[180px]",
      render: (row) => <span className="text-[13px] text-ink">{customerLabel(row, included)}</span>,
    },
    {
      key: "detail",
      header: tOrders("items"),
      render: (row) => <span className="block truncate text-[13px] text-ink-2">{describeLines(row, included)}</span>,
    },
    {
      key: "covers",
      header: "Couv.",
      className: "w-[64px]",
      render: (row) => <span className="font-mono text-[12px] text-ink-2">{totalCovers(row, included)}</span>,
    },
    {
      key: "notes",
      header: "",
      className: "w-[36px]",
      render: (row) =>
        row.attributes.notes ? (
          <span
            title={row.attributes.notes}
            aria-label={row.attributes.notes}
            className="inline-block text-[13px] text-warn"
          >
            ⚠
          </span>
        ) : null,
    },
    {
      key: "status",
      header: tOrders("status"),
      className: "w-[140px]",
      render: (row) => <StatusPill status={row.attributes.status} />,
    },
    {
      key: "total",
      header: tOrders("total"),
      className: "w-[110px] text-right",
      render: (row) => (
        <span className="block text-right font-mono text-[12.5px] text-ink">
          {formatPrice(row.attributes.total_cents, row.attributes.currency)}
        </span>
      ),
    },
  ];

  return (
    <DataTable<OrderData>
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      skeletonRows={8}
      rowKey={(row) => row.id}
      onRowClick={(row) => onRowClick(row)}
      className={selectedId ? "has-selected" : undefined}
      emptyState={
        <EmptyState
          title={tOrders("empty")}
          body={tOrders("emptyRealtimeBody")}
          action={
            <Button variant="ink" onClick={onCreateClick}>
              + {tOrders("new")}
            </Button>
          }
        />
      }
    />
  );
}
