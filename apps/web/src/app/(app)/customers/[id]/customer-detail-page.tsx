"use client";

import { Button, Skeleton } from "@ody/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
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
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

interface CustomerDetailPageProps {
  customerId: string;
}

export function CustomerDetailPage({ customerId }: CustomerDetailPageProps) {
  const tCustomers = useTranslations("customers");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data, isLoading, isError } = useCustomer(customerId);
  const remove = useDeleteCustomer();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="mt-3 grid grid-cols-4 gap-3">
          {["a", "b", "c", "d"].map((k) => (
            <Skeleton key={k} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-card border border-line bg-surface p-6">
        <p className="text-[13px] text-neg">{tCustomers("notFound")}</p>
        <Link href="/customers" className="mt-3 inline-flex text-[12.5px] text-accent hover:underline">
          ← {tCustomers("backToList")}
        </Link>
      </div>
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
          router.push("/customers");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/customers" className="self-start text-[12.5px] text-ink-2 hover:text-ink">
        ← {tCustomers("backToList")}
      </Link>

      <header className="flex items-end justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{tCustomers("detailEyebrow")}</div>
          <h1 className="mt-1.5 font-serif text-[38px] italic text-ink" style={{ letterSpacing: "-0.4px" }}>
            {a.first_name} {a.last_name}
          </h1>
          <div className="mt-1 flex gap-3 font-mono text-[12px] text-ink-2">
            {a.email && <span>{a.email}</span>}
            {a.phone && <span>· {a.phone}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDelete} disabled={remove.isPending}>
            {tCommon("delete")}
          </Button>
          <Button variant="ink" onClick={() => setEditOpen(true)}>
            {tCustomers("edit")}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-3">
        <KpiTile label={tCustomers("visits")} value={String(a.visits_count)} />
        <KpiTile label={tCustomers("spent")} value={formatPrice(a.spent_cents, a.currency)} />
        <KpiTile label={tCustomers("averageBasket")} value={formatPrice(avg, a.currency)} />
        <KpiTile label={tCustomers("lastVisit")} value={formatDate(a.updated_at)} />
      </section>

      <section className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-card border border-line bg-surface p-5">
          <div className="text-[12px] uppercase tracking-[0.04em] text-ink-2">{tCustomers("history")}</div>
          <div className="mt-3 py-6 text-center font-serif text-[14px] italic text-ink-3">
            {tCustomers("historyEmpty")}
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <div className="text-[12px] uppercase tracking-[0.04em] text-ink-2">{tCustomers("notes")}</div>
          <div className="mt-3 font-serif text-[14px] italic leading-[1.55] text-ink-2">
            {a.notes ? `« ${a.notes} »` : "—"}
          </div>
        </div>
      </section>

      <CustomerFormModal open={editOpen} onOpenChange={setEditOpen} customer={data} />
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-5 py-4">
      <div className="text-[11px] uppercase tracking-[0.04em] text-ink-3">{label}</div>
      <div className="mt-2 text-[26px] font-medium text-ink" style={{ letterSpacing: "-0.4px" }}>
        {value}
      </div>
    </div>
  );
}
