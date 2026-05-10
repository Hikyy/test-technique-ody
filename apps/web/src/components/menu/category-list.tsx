"use client";

import { useTranslations } from "next-intl";
import type { CategoryData } from "@/lib/hooks/use-categories";
import type { DishData } from "@/lib/hooks/use-dishes";

interface CategoryListProps {
  categories: CategoryData[];
  dishes: DishData[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryList({ categories, dishes, activeId, onSelect }: CategoryListProps) {
  const tMenu = useTranslations("menu");
  const counts = countByCategory(dishes);

  return (
    <div className="flex h-fit flex-col rounded-card border border-line bg-surface px-3 py-3.5">
      <div className="px-2 pb-2 text-[10.5px] uppercase tracking-[0.06em] text-ink-3">{tMenu("categories")}</div>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={
          activeId === null
            ? "flex items-center justify-between rounded-sm bg-accent-soft px-2.5 py-[7px] text-left text-[13px] font-medium text-ink"
            : "flex items-center justify-between rounded-sm px-2.5 py-[7px] text-left text-[13px] text-ink-2 transition-colors hover:bg-accent-soft/50 hover:text-ink"
        }
      >
        <span>{tMenu("allCategories")}</span>
        <span className={activeId === null ? "font-mono text-[11px] text-accent" : "font-mono text-[11px] text-ink-3"}>
          {dishes.length}
        </span>
      </button>
      {categories.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={
              active
                ? "mt-px flex items-center justify-between rounded-sm bg-accent-soft px-2.5 py-[7px] text-left text-[13px] font-medium text-ink"
                : "mt-px flex items-center justify-between rounded-sm px-2.5 py-[7px] text-left text-[13px] text-ink-2 transition-colors hover:bg-accent-soft/50 hover:text-ink"
            }
          >
            <span>{c.attributes.name}</span>
            <span className={active ? "font-mono text-[11px] text-accent" : "font-mono text-[11px] text-ink-3"}>
              {counts.get(c.id) ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function countByCategory(dishes: DishData[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const d of dishes) {
    const cid = d.relationships.category.data.id;
    m.set(cid, (m.get(cid) ?? 0) + 1);
  }
  return m;
}
