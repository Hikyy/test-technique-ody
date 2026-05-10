"use client";

import { Button, SearchBar } from "@ody/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { OrderStatus } from "@/lib/hooks/use-orders";

const STATUS_FILTERS: { key: "all" | OrderStatus; tKey: string }[] = [
  { key: "all", tKey: "all" },
  { key: "pending", tKey: "statuses.pending" },
  { key: "cooking", tKey: "statuses.cooking" },
  { key: "sent", tKey: "statuses.sent" },
  { key: "served", tKey: "statuses.served" },
  { key: "cancelled", tKey: "statuses.cancelled" },
];

type SearchScope = "table" | "dish" | "notes";

interface OrderFiltersProps {
  status: OrderStatus | undefined;
  search: string;
  scope: SearchScope;
  onScopeChange: (s: SearchScope) => void;
  onCreateClick: () => void;
}

export function OrderFilters({ status, search, scope, onScopeChange, onCreateClick }: OrderFiltersProps) {
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);

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
      next.delete("page");
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
        updateParams({ search: searchInput || null });
      }
    }, 250);
    return () => clearTimeout(id);
  }, [searchInput, search, updateParams]);

  const activeKey: "all" | OrderStatus = status ?? "all";

  const scopes = [
    { key: "table" as const, label: tOrders("table") },
    { key: "dish" as const, label: tOrders("dish") },
    { key: "notes" as const, label: tOrders("notes") },
  ];
  const placeholders: Record<SearchScope, string> = {
    table: tOrders("search.tablePlaceholder"),
    dish: tOrders("search.dishPlaceholder"),
    notes: tOrders("search.notesPlaceholder"),
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-end justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            placeholder={placeholders[scope]}
            aria-label={tCommon("search")}
            scopes={scopes}
            scope={scope}
            onScopeChange={onScopeChange}
          />
        </div>
        <Button variant="ink" onClick={onCreateClick}>
          {tOrders("new").startsWith("+") ? tOrders("new") : `+ ${tOrders("new")}`}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-card border border-line bg-surface px-4 py-2">
        {STATUS_FILTERS.map((f) => {
          const active = f.key === activeKey;
          const label = f.key === "all" ? tOrders("filters.all") : tOrders(f.tKey as "statuses.pending");
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => updateParams({ status: f.key === "all" ? null : f.key })}
              className={
                active
                  ? "rounded-sm bg-accent-soft px-3 py-1.5 text-[12.5px] font-medium text-ink"
                  : "rounded-sm px-3 py-1.5 text-[12.5px] text-ink-2 transition-colors hover:bg-accent-soft/40"
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
