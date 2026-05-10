"use client";

import { Button, DataTable, type DataTableColumn, EmptyState } from "@ody/ui";
import { useTranslations } from "next-intl";
import type { CustomerData } from "@/lib/hooks/use-customers";

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(d);
  } catch {
    return "—";
  }
}

interface CustomerTableProps {
  rows: CustomerData[];
  isLoading: boolean;
  selectedId: string | null;
  onRowClick: (row: CustomerData) => void;
  onCreateClick: () => void;
}

export function CustomerTable({ rows, isLoading, selectedId, onRowClick, onCreateClick }: CustomerTableProps) {
  const tCustomers = useTranslations("customers");

  const columns: DataTableColumn<CustomerData>[] = [
    {
      key: "name",
      header: tCustomers("lastName"),
      render: (row) => (
        <div>
          <div className="font-serif text-[15px] italic text-ink">
            {row.attributes.first_name} {row.attributes.last_name}
          </div>
          <div className="mt-0.5 font-mono text-[10.5px] text-ink-3">#{row.id.slice(0, 8)}</div>
        </div>
      ),
    },
    {
      key: "contact",
      header: tCustomers("contact"),
      className: "w-[220px]",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-[12px] text-ink-2">{row.attributes.email ?? "—"}</span>
          <span className="mt-0.5 font-mono text-[11.5px] text-ink-3">{row.attributes.phone ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "visits",
      header: tCustomers("visits"),
      className: "w-[80px] text-right",
      render: (row) => (
        <span className="block text-right font-mono text-[12.5px] text-ink-2">{row.attributes.visits_count}</span>
      ),
    },
    {
      key: "spent",
      header: tCustomers("spent"),
      className: "w-[120px] text-right",
      render: (row) => (
        <span className="block text-right font-mono text-[12.5px] text-ink">
          {formatPrice(row.attributes.spent_cents, row.attributes.currency)}
        </span>
      ),
    },
    {
      key: "lastVisit",
      header: tCustomers("lastVisit"),
      className: "w-[100px] text-right",
      render: (row) => (
        <span className="block text-right font-mono text-[11.5px] text-ink-3">
          {formatDate(row.attributes.updated_at)}
        </span>
      ),
    },
  ];

  return (
    <DataTable<CustomerData>
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      skeletonRows={8}
      rowKey={(row) => row.id}
      onRowClick={(row) => onRowClick(row)}
      className={selectedId ? "has-selected" : undefined}
      emptyState={
        <EmptyState
          title={tCustomers("emptyTitle")}
          body={tCustomers("empty")}
          action={
            <Button variant="ink" onClick={onCreateClick}>
              + {tCustomers("new")}
            </Button>
          }
        />
      }
    />
  );
}
