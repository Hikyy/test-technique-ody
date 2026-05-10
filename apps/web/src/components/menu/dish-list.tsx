"use client";

import { Button, EmptyState, Skeleton } from "@ody/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { CategoryData } from "@/lib/hooks/use-categories";
import { useDeleteDish } from "@/lib/hooks/use-delete-dish";
import type { DishData } from "@/lib/hooks/use-dishes";
import { useToggleDishAvailability } from "@/lib/hooks/use-toggle-dish-availability";

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

interface DishListProps {
  dishes: DishData[];
  categories: CategoryData[];
  activeCategoryId: string | null;
  isLoading: boolean;
  onEdit: (dish: DishData) => void;
  onCreate: () => void;
}

export function DishList({ dishes, categories, activeCategoryId, isLoading, onEdit, onCreate }: DishListProps) {
  const tMenu = useTranslations("menu");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {["a", "b", "c"].map((k) => (
          <Skeleton key={k} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (dishes.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-6">
        <EmptyState
          title={tMenu("emptyTitle")}
          body={activeCategoryId ? tMenu("emptyCategory") : tMenu("empty")}
          action={
            <Button variant="ink" onClick={onCreate}>
              + {tMenu("newDish")}
            </Button>
          }
        />
      </div>
    );
  }

  if (activeCategoryId) {
    const cat = categories.find((c) => c.id === activeCategoryId);
    const items = dishes.filter((d) => d.relationships.category.data.id === activeCategoryId);
    return <CategoryGroup title={cat?.attributes.name ?? "—"} dishes={items} onEdit={onEdit} />;
  }

  const groups = groupByCategory(dishes, categories);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <CategoryGroup key={g.category.id} title={g.category.attributes.name} dishes={g.dishes} onEdit={onEdit} />
      ))}
    </div>
  );
}

function groupByCategory(
  dishes: DishData[],
  categories: CategoryData[],
): Array<{ category: CategoryData; dishes: DishData[] }> {
  const sorted = [...categories].sort((a, b) => a.attributes.position - b.attributes.position);
  return sorted
    .map((c) => ({
      category: c,
      dishes: dishes.filter((d) => d.relationships.category.data.id === c.id),
    }))
    .filter((g) => g.dishes.length > 0);
}

function CategoryGroup({
  title,
  dishes,
  onEdit,
}: {
  title: string;
  dishes: DishData[];
  onEdit: (d: DishData) => void;
}) {
  const tMenu = useTranslations("menu");
  return (
    <div className="rounded-card border border-line bg-surface px-[22px] py-[18px]">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-[22px] italic text-ink">{title}</h3>
        <span className="font-mono text-[11px] text-ink-3">{tMenu("countDishes", { count: dishes.length })}</span>
      </div>
      {dishes.map((d) => (
        <DishRow key={d.id} dish={d} onEdit={onEdit} />
      ))}
    </div>
  );
}

function DishRow({ dish, onEdit }: { dish: DishData; onEdit: (d: DishData) => void }) {
  const tMenu = useTranslations("menu");
  const tCommon = useTranslations("common");
  const toggle = useToggleDishAvailability();
  const remove = useDeleteDish();
  const a = dish.attributes;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle.mutate(
      { id: dish.id },
      {
        onSuccess: () => toast.success(tMenu("toggled")),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(tMenu("confirmDelete"))) return;
    remove.mutate(
      { id: dish.id },
      {
        onSuccess: () => toast.success(tMenu("deleted")),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="grid grid-cols-[1fr_120px_120px_60px] items-center gap-3 border-t border-line py-3 first:border-t-0">
      <div>
        <div className="text-[14px] text-ink">{a.name}</div>
        {a.description && <div className="mt-0.5 text-[11.5px] text-ink-2">{a.description}</div>}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggle.isPending}
        className={
          a.available
            ? "inline-flex h-6 items-center justify-center rounded-full bg-accent-soft px-3 text-[11px] font-medium text-accent transition-opacity hover:opacity-80 disabled:opacity-40"
            : "inline-flex h-6 items-center justify-center rounded-full bg-neg/10 px-3 text-[11px] font-medium text-neg transition-opacity hover:opacity-80 disabled:opacity-40"
        }
        aria-label={a.available ? tMenu("unavailable") : tMenu("available")}
      >
        {a.available ? tMenu("available") : tMenu("unavailable")}
      </button>
      <div className="text-right font-mono text-[13.5px] font-medium text-ink">
        {formatPrice(a.price_cents, a.currency)}
      </div>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onEdit(dish)}
          className="grid size-7 place-items-center rounded-sm text-ink-3 transition-colors hover:bg-accent-soft hover:text-ink"
          aria-label={tCommon("edit")}
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={remove.isPending}
          className="grid size-7 place-items-center rounded-sm text-ink-3 transition-colors hover:bg-accent-soft hover:text-neg disabled:opacity-40"
          aria-label={tCommon("delete")}
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
