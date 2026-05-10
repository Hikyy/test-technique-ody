"use client";

import { Button, SearchBar } from "@ody/ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { CustomerDetailRail } from "@/components/customers/customer-detail-rail";
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
import { CustomerTable } from "@/components/customers/customer-table";
import { type CustomerData, useCustomers } from "@/lib/hooks/use-customers";

interface CustomersPageClientProps {
  initialSearch: string;
  initialPage: number;
}

const PAGE_SIZE = 20;

export function CustomersPageClient({ initialSearch, initialPage }: CustomersPageClientProps) {
  const tCustomers = useTranslations("customers");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  const customerSearchScopes = [
    { key: "name" as const, label: tCustomers("lastName") },
    { key: "email" as const, label: tCustomers("email") },
    { key: "phone" as const, label: tCustomers("phone") },
  ] as const;
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const search = sp?.get("search") ?? initialSearch;
  const page = Number(sp?.get("page") ?? initialPage) || 1;

  const [searchInput, setSearchInput] = useState(search);
  const [scope, setScope] = useState<"name" | "email" | "phone">("name");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CustomerData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(sp?.toString() ?? "");
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, sp],
  );

  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput || null, page: null });
      }
    }, 250);
    return () => clearTimeout(id);
  }, [searchInput, search, updateParams]);

  const queryParams = useMemo(
    () => ({ search: search || undefined, search_scope: scope, page, pageSize: PAGE_SIZE }),
    [search, scope, page],
  );
  const query = useCustomers(queryParams);
  const items = query.data?.items ?? [];
  const meta = query.data?.meta;
  const total = typeof meta?.total === "number" ? meta.total : items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleEdit = useCallback(() => {
    const found = items.find((c) => c.id === selectedId);
    if (found) {
      setEditing(found);
      setEditOpen(true);
    }
  }, [items, selectedId]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{tCustomers("eyebrow")}</div>
          <h1 className="mt-1.5 font-serif text-[40px] italic text-ink" style={{ letterSpacing: "-0.5px" }}>
            {tCustomers("title")}
          </h1>
        </div>
        <Button variant="ink" onClick={() => setCreateOpen(true)}>
          + {tCustomers("new")}
        </Button>
      </header>

      <div className="flex flex-col gap-3.5">
        <div className="max-w-md">
          <SearchBar
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            placeholder={
              scope === "name"
                ? tCustomers("search.namePlaceholder")
                : scope === "email"
                  ? tCustomers("search.emailPlaceholder")
                  : tCustomers("search.phonePlaceholder")
            }
            aria-label={tCommon("search")}
            scopes={customerSearchScopes}
            scope={scope}
            onScopeChange={setScope}
          />
        </div>
      </div>

      {query.isError ? (
        <div className="rounded-card border border-neg/30 bg-neg/5 p-4 text-[13px] text-neg">
          {(query.error as Error)?.message ?? tErrors("generic")}
        </div>
      ) : (
        <CustomerTable
          rows={items}
          isLoading={query.isLoading}
          selectedId={selectedId}
          onRowClick={(row) => setSelectedId(row.id)}
          onCreateClick={() => setCreateOpen(true)}
        />
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} basePath="/customers" search={search} />}

      <CustomerDetailRail customerId={selectedId} onClose={() => setSelectedId(null)} onEdit={handleEdit} />

      <CustomerFormModal open={createOpen} onOpenChange={setCreateOpen} customer={null} />

      <CustomerFormModal
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditing(null);
        }}
        customer={editing}
      />
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  search: string;
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

function Pagination({ page, totalPages, basePath, search }: PaginationProps) {
  const tCommon = useTranslations("common");
  const link = (target: number) => {
    const sp = new URLSearchParams();
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
