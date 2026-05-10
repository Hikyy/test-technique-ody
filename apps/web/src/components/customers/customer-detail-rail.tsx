"use client";

import { Button, Modal, ModalContent, Skeleton } from "@ody/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useCustomer } from "@/lib/hooks/use-customer";
import { useDeleteCustomer } from "@/lib/hooks/use-delete-customer";

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
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);
  } catch {
    return "—";
  }
}

interface CustomerDetailRailProps {
  customerId: string | null;
  onClose: () => void;
  onEdit: () => void;
}

export function CustomerDetailRail({ customerId, onClose, onEdit }: CustomerDetailRailProps) {
  const open = Boolean(customerId);
  return (
    <Modal open={open} onOpenChange={(v: boolean) => (v ? null : onClose())}>
      <ModalContent variant="side-rail" className="overflow-y-auto p-0">
        {customerId ? <RailBody customerId={customerId} onClose={onClose} onEdit={onEdit} /> : null}
      </ModalContent>
    </Modal>
  );
}

function RailBody({ customerId, onClose, onEdit }: { customerId: string; onClose: () => void; onEdit: () => void }) {
  const tCustomers = useTranslations("customers");
  const tCommon = useTranslations("common");
  const { data, isLoading, isError } = useCustomer(customerId);
  const remove = useDeleteCustomer();

  if (isLoading) return <RailSkeleton />;
  if (isError || !data) {
    return (
      <RailFrame>
        <p className="text-[13px] text-neg">{tCustomers("notFound")}</p>
      </RailFrame>
    );
  }

  const a = data.attributes;
  const avg = a.visits_count > 0 ? Math.round(a.spent_cents / a.visits_count) : 0;

  const handleDelete = () => {
    if (!confirm(tCustomers("confirmDelete"))) return;
    remove.mutate(
      { id: data.id },
      {
        onSuccess: () => {
          toast.success(tCustomers("deleted"));
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <RailFrame>
      <header className="flex items-baseline justify-between">
        <div className="text-[11px] uppercase tracking-[0.04em] text-ink-3">{tCustomers("detailEyebrow")}</div>
        <Link href={`/customers/${data.id}`} className="font-mono text-[11px] text-accent hover:underline">
          {tCommon("details")} →
        </Link>
      </header>

      <h2 className="font-serif text-[28px] italic leading-[1.05] text-ink" style={{ letterSpacing: "-0.3px" }}>
        {a.first_name} {a.last_name}
      </h2>
      <div className="flex flex-col gap-0.5 font-mono text-[12px] text-ink-2">
        {a.email && <span>{a.email}</span>}
        {a.phone && <span>{a.phone}</span>}
      </div>

      {a.notes && (
        <div className="mt-1 rounded-card border border-line bg-bg p-3 font-serif text-[13px] italic leading-[1.5] text-ink-2">
          « {a.notes} »
        </div>
      )}

      <div className="mt-2 grid grid-cols-3 border-t border-line pt-3">
        <KpiCell label={tCustomers("visits")} value={String(a.visits_count)} />
        <KpiCell label={tCustomers("spent")} value={formatPrice(a.spent_cents, a.currency)} />
        <KpiCell label={tCustomers("averageBasket")} value={formatPrice(avg, a.currency)} />
      </div>

      <div className="border-t border-line pt-3 text-[11.5px] text-ink-3">
        {tCustomers("lastVisit")} · <span className="font-mono text-ink-2">{formatDate(a.updated_at)}</span>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-3">
        <Button variant="ink" onClick={onEdit}>
          {tCustomers("edit")}
        </Button>
        <Button variant="outline" onClick={handleDelete} disabled={remove.isPending}>
          {tCommon("delete")}
        </Button>
      </div>
    </RailFrame>
  );
}

function KpiCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-3 first:pl-0 last:pr-0 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-line">
      <div className="text-[10.5px] uppercase tracking-[0.04em] text-ink-3">{label}</div>
      <div className="font-sans text-[16px] font-medium text-ink">{value}</div>
    </div>
  );
}

function RailFrame({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col gap-3 p-6">{children}</div>;
}

function RailSkeleton() {
  return (
    <RailFrame>
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="mt-3 h-16 w-full" />
      <Skeleton className="mt-3 h-9 w-full" />
    </RailFrame>
  );
}
