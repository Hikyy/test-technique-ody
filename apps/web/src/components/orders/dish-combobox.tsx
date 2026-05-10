"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import { AsyncCombobox } from "@/components/ui/async-combobox";
import { apiList } from "@/lib/api-client";
import type { DishData } from "@/lib/hooks/use-dishes";

interface DishComboboxProps {
  value: DishData | null;
  onChange: (value: DishData | null) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  categoryId?: string | null;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

const PAGE_SIZE = 20;

export function DishCombobox({ value, onChange, id, invalid, disabled, categoryId }: DishComboboxProps) {
  const tOrders = useTranslations("orders");
  const cacheRef = useRef<DishData[] | null>(null);

  const fetchItems = useCallback(
    async (search: string, page: number) => {
      if (cacheRef.current === null) {
        const res = await apiList<DishData>("/api/menu/dishes", { query: { available: "true" } });
        cacheRef.current = res.items;
      }
      const all = cacheRef.current;
      const needle = search.trim().toLowerCase();
      const byCategory = categoryId ? all.filter((d) => d.relationships.category.data.id === categoryId) : all;
      const filtered = needle ? byCategory.filter((d) => d.attributes.name.toLowerCase().includes(needle)) : byCategory;
      const sorted = [...filtered].sort((a, b) => a.attributes.name.localeCompare(b.attributes.name, "fr"));
      const slice = sorted.slice(0, page * PAGE_SIZE);
      return { items: slice, total: sorted.length };
    },
    [categoryId],
  );

  return (
    <AsyncCombobox<DishData>
      id={id}
      value={value}
      onChange={onChange}
      fetchItems={fetchItems}
      itemKey={(d) => d.id}
      itemLabel={(d) => d.attributes.name}
      renderItem={(d) => (
        <span className="flex w-full items-center justify-between gap-3">
          <span className="truncate font-sans text-[13px] text-ink">{d.attributes.name}</span>
          <span className="shrink-0 font-mono text-[11px] text-ink-2">
            {formatPrice(d.attributes.price_cents, d.attributes.currency)}
          </span>
        </span>
      )}
      placeholder={tOrders("pickDish")}
      searchPlaceholder={tOrders("searchDish")}
      invalid={invalid}
      disabled={disabled}
    />
  );
}
