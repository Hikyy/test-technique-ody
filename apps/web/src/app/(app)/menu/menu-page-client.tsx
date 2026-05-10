"use client";

import { Button } from "@ody/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState, useTransition } from "react";
import { CategoryList } from "@/components/menu/category-list";
import { DishFormModal } from "@/components/menu/dish-form-modal";
import { DishList } from "@/components/menu/dish-list";
import { useCategories } from "@/lib/hooks/use-categories";
import { type DishData, useDishes } from "@/lib/hooks/use-dishes";

interface MenuPageClientProps {
  initialCategoryId: string | null;
}

export function MenuPageClient({ initialCategoryId }: MenuPageClientProps) {
  const tMenu = useTranslations("menu");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCategoryId = sp?.get("category") ?? initialCategoryId;

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DishData | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const categoriesQuery = useCategories();
  const dishesQuery = useDishes({
    category_id: activeCategoryId ?? undefined,
  });

  const categories = categoriesQuery.data?.items ?? [];
  const dishes = dishesQuery.data?.items ?? [];

  const onSelect = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(sp?.toString() ?? "");
      if (id) next.set("category", id);
      else next.delete("category");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, sp],
  );

  const handleEdit = (dish: DishData) => {
    setEditing(dish);
    setEditOpen(true);
  };

  const isLoading = dishesQuery.isLoading || categoriesQuery.isLoading;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{tMenu("eyebrow")}</div>
          <h1 className="mt-1.5 font-serif text-[40px] italic text-ink" style={{ letterSpacing: "-0.5px" }}>
            {tMenu("title")}
          </h1>
        </div>
        <Button variant="ink" onClick={() => setCreateOpen(true)}>
          + {tMenu("newDish")}
        </Button>
      </header>

      <section className="grid grid-cols-[200px_1fr] gap-4">
        <CategoryList categories={categories} dishes={dishes} activeId={activeCategoryId} onSelect={onSelect} />

        {dishesQuery.isError ? (
          <div className="rounded-card border border-neg/30 bg-neg/5 p-4 text-[13px] text-neg">
            {(dishesQuery.error as Error)?.message ?? tErrors("generic")}
          </div>
        ) : (
          <DishList
            dishes={dishes}
            categories={categories}
            activeCategoryId={activeCategoryId}
            isLoading={isLoading}
            onEdit={handleEdit}
            onCreate={() => setCreateOpen(true)}
          />
        )}
      </section>

      <DishFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        defaultCategoryId={activeCategoryId ?? undefined}
        dish={null}
      />

      <DishFormModal
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditing(null);
        }}
        categories={categories}
        dish={editing}
      />
    </div>
  );
}
