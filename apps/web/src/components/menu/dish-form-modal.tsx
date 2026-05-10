"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type CreateDishInput, createDishSchema } from "@ody/sdk";
import {
  Button,
  FormField,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@ody/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DishImagePicker } from "@/components/menu/dish-image-picker";
import type { CategoryData } from "@/lib/hooks/use-categories";
import { useCreateDish } from "@/lib/hooks/use-create-dish";
import type { DishData } from "@/lib/hooks/use-dishes";
import { useUpdateDish } from "@/lib/hooks/use-update-dish";

type FormValues = CreateDishInput;

interface DishFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish?: DishData | null;
  categories: CategoryData[];
  defaultCategoryId?: string;
}

export function DishFormModal({ open, onOpenChange, dish, categories, defaultCategoryId }: DishFormModalProps) {
  const tMenu = useTranslations("menu");
  const tCommon = useTranslations("common");
  const create = useCreateDish();
  const update = useUpdateDish();
  const isEdit = Boolean(dish);

  const form = useForm<FormValues>({
    resolver: zodResolver(createDishSchema),
    defaultValues: {
      category_id: defaultCategoryId ?? "",
      name: "",
      description: "",
      price_eur: 0,
      available: true,
      image_url: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (!open) return;
    if (dish) {
      form.reset({
        category_id: dish.relationships.category.data.id,
        name: dish.attributes.name,
        description: dish.attributes.description ?? "",
        price_eur: dish.attributes.price_cents / 100,
        available: dish.attributes.available,
        image_url: dish.attributes.image_url ?? "",
      });
    } else {
      form.reset({
        category_id: defaultCategoryId ?? "",
        name: "",
        description: "",
        price_eur: 0,
        available: true,
        image_url: "",
      });
    }
  }, [open, dish, defaultCategoryId, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      category_id: values.category_id,
      name: values.name,
      description: values.description ? values.description : null,
      price_cents: Math.round(values.price_eur * 100),
      available: values.available,
      image_url: values.image_url ? values.image_url : null,
    };

    if (isEdit && dish) {
      update.mutate(
        { id: dish.id, patch: payload },
        {
          onSuccess: () => {
            toast.success(tMenu("updated"));
            onOpenChange(false);
          },
          onError: (err) => toast.error(err.message),
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: () => {
        toast.success(tMenu("created"));
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const pending = create.isPending || update.isPending;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent variant="center" className="max-w-xl">
        <ModalHeader>
          <ModalTitle>{isEdit ? tMenu("editDish") : tMenu("newDish")}</ModalTitle>
          <ModalDescription>{isEdit ? tMenu("descriptionEdit") : tMenu("descriptionNew")}</ModalDescription>
        </ModalHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dish-category" className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
              {tMenu("category")}
              <span className="ml-1 text-neg">*</span>
            </label>
            <select
              id="dish-category"
              className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              {...form.register("category_id")}
            >
              <option value="" disabled>
                {tCommon("search")}…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.attributes.name}
                </option>
              ))}
            </select>
            {form.formState.errors.category_id?.message && (
              <p className="text-[11.5px] text-neg">{form.formState.errors.category_id.message}</p>
            )}
          </div>

          <FormField
            label={tMenu("name")}
            required
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="dish-description"
              className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2"
            >
              {tMenu("description")}
            </label>
            <textarea
              id="dish-description"
              rows={3}
              placeholder={tMenu("descriptionPlaceholder")}
              className="flex w-full rounded-[8px] border border-line-mid bg-surface px-3 py-2 font-sans text-[13.5px] text-ink placeholder:text-ink-3 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={tMenu("priceEur")}
              type="number"
              step="0.01"
              min={0}
              required
              error={form.formState.errors.price_eur?.message}
              {...form.register("price_eur", { valueAsNumber: true })}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
                {tMenu("imageUrl")}
              </label>
              <DishImagePicker
                value={form.watch("image_url") ?? ""}
                onChange={(url) => form.setValue("image_url", url, { shouldValidate: true, shouldDirty: true })}
                invalid={Boolean(form.formState.errors.image_url?.message)}
              />
              {form.formState.errors.image_url?.message && (
                <p className="text-[11.5px] text-neg">{form.formState.errors.image_url.message}</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input type="checkbox" className="size-4 accent-accent" {...form.register("available")} />
            {tMenu("available")}
          </label>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? tCommon("saving") : isEdit ? tCommon("save") : tCommon("create")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
