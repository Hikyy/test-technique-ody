"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { NewOrderModal } from "@/components/orders/new-order-modal";
import { OrderDetailRail } from "@/components/orders/order-detail-rail";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrderTable } from "@/components/orders/order-table";
import { type OrderSearchScope, type OrderStatus, useOrders } from "@/lib/hooks/use-orders";

const STATUS_VALUES: OrderStatus[] = ["pending", "cooking", "sent", "served", "cancelled"];

function isOrderStatus(v: string | null | undefined): v is OrderStatus {
  return Boolean(v) && STATUS_VALUES.includes(v as OrderStatus);
}

interface OrdersPageClientProps {
  initialStatus: string | null;
  initialSearch: string;
  initialPage: number;
}

export function OrdersPageClient({ initialStatus, initialSearch, initialPage }: OrdersPageClientProps) {
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const sp = useSearchParams();

  const status: OrderStatus | undefined = useMemo(() => {
    const v = sp?.get("status") ?? initialStatus;
    return isOrderStatus(v) ? v : undefined;
  }, [sp, initialStatus]);

  const search = sp?.get("search") ?? initialSearch;
  const page = Number(sp?.get("page") ?? initialPage) || 1;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [scope, setScope] = useState<OrderSearchScope>("table");

  const query = useOrders({
    status,
    page,
    pageSize: 20,
    search: search || undefined,
    search_scope: scope,
  });
  const items = query.data?.items ?? [];
  const included = query.data?.included ?? [];
  const meta = query.data?.meta;
  const total = typeof meta?.total === "number" ? meta.total : 0;
  const pageSize = typeof meta?.pageSize === "number" && meta.pageSize > 0 ? meta.pageSize : 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filteredItems = items;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{tCommon("eveningService")}</div>
          <h1 className="mt-1.5 font-serif text-[40px] italic text-ink" style={{ letterSpacing: "-0.5px" }}>
            {tOrders("title")}
          </h1>
        </div>
      </header>

      <OrderFilters
        status={status}
        search={search}
        scope={scope}
        onScopeChange={setScope}
        onCreateClick={() => setCreateOpen(true)}
      />

      {query.isError ? (
        <div className="rounded-card border border-neg/30 bg-neg/5 p-4 text-[13px] text-neg">
          {(query.error as Error)?.message ?? tErrors("generic")}
        </div>
      ) : (
        <OrderTable
          rows={filteredItems}
          included={included}
          isLoading={query.isLoading}
          selectedId={selectedId}
          onRowClick={(row) => setSelectedId(row.id)}
          onCreateClick={() => setCreateOpen(true)}
        />
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} basePath="/orders" search={search} status={status} />
      )}

      <OrderDetailRail orderId={selectedId} onClose={() => setSelectedId(null)} />

      <NewOrderModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  search: string;
  status: OrderStatus | undefined;
}

function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  const className =
    "inline-flex h-8 items-center justify-center rounded-[8px] border border-line-mid bg-surface px-3 text-[12.5px] text-ink transition-colors hover:bg-accent-soft";
  if (disabled) {
    return (
      <span className={`${className} pointer-events-none opacity-40`} aria-disabled>
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function Pagination({ page, totalPages, basePath, search, status }: PaginationProps) {
  const tCommon = useTranslations("common");
  const link = (target: number) => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (search) sp.set("search", search);
    if (target > 1) sp.set("page", String(target));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav className="flex items-center justify-center gap-2 pt-2" aria-label="Pagination">
      <PageLink href={link(page - 1)} disabled={page <= 1} label={tCommon("previous")} />
      <span className="font-mono text-[12px] text-ink-2">
        {page} {tCommon("of")} {totalPages}
      </span>
      <PageLink href={link(page + 1)} disabled={page >= totalPages} label={tCommon("next")} />
    </nav>
  );
}
