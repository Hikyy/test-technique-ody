"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateOrderInput,
  createOrderSchema,
  type ReservationData,
  type TableData,
  useCategories,
  useReservations,
  useTables,
} from "@ody/sdk";
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
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { CustomerCombobox } from "@/components/orders/customer-combobox";
import { DishCombobox } from "@/components/orders/dish-combobox";
import { type CreateOrderDTO, useCreateOrder } from "@/lib/hooks/use-create-order";
import type { CustomerData } from "@/lib/hooks/use-customers";
import type { DishData } from "@/lib/hooks/use-dishes";

type FormValues = CreateOrderInput;

const defaultValues: FormValues = {
  table_number: 1,
  table_id: "",
  reservation_id: "",
  customer_id: "",
  scheduled_at: "",
  notes: "",
  lines: [{ dish_id: "", qty: 1, unit_price_cents: 0, notes: "" }],
};

interface NewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatEur(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function NewOrderModal({ open, onOpenChange }: NewOrderModalProps) {
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const create = useCreateOrder();

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<Array<DishData | null>>([null]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const tablesQ = useTables();
  const tables = (tablesQ.data?.items ?? []) as TableData[];
  const categoriesQ = useCategories();
  const categories = categoriesQ.data?.items ?? [];

  // Today's reservations (so we can link the order to one).
  const todayFrom = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const todayTo = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }, []);
  const reservationsQ = useReservations({ from: todayFrom, to: todayTo, status: "confirmed,seated" });
  const reservations = (reservationsQ.data?.items ?? []) as ReservationData[];

  const form = useForm<FormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues,
    mode: "onBlur",
  });

  const lines = useFieldArray({ control: form.control, name: "lines" });

  const handleCustomerChange = (c: CustomerData | null) => {
    setSelectedCustomer(c);
    form.setValue("customer_id", c?.id ?? "", { shouldValidate: true });
  };

  const handleDishChange = (idx: number, d: DishData | null) => {
    setSelectedDishes((prev) => {
      const next = [...prev];
      next[idx] = d;
      return next;
    });
    form.setValue(`lines.${idx}.dish_id`, d?.id ?? "", { shouldValidate: true });
    form.setValue(`lines.${idx}.unit_price_cents`, d?.attributes.price_cents ?? 0, {
      shouldValidate: true,
    });
  };

  const appendLine = () => {
    lines.append({ dish_id: "", qty: 1, unit_price_cents: 0, notes: "" });
    setSelectedDishes((prev) => [...prev, null]);
  };

  const removeLine = (idx: number) => {
    lines.remove(idx);
    setSelectedDishes((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetAll = () => {
    form.reset(defaultValues);
    setSelectedCustomer(null);
    setSelectedDishes([null]);
  };

  const onSubmit = (values: FormValues) => {
    const input: CreateOrderDTO = {
      table_number: values.table_number,
      table_id: values.table_id ? values.table_id : null,
      reservation_id: values.reservation_id ? values.reservation_id : null,
      customer_id: values.customer_id ? values.customer_id : null,
      scheduled_at: new Date(values.scheduled_at).toISOString(),
      notes: values.notes ? values.notes : null,
      lines: values.lines.map((l) => ({
        dish_id: l.dish_id,
        qty: l.qty,
        unit_price_cents: l.unit_price_cents,
        notes: l.notes ? l.notes : null,
      })),
    };

    create.mutate(input, {
      onSuccess: () => {
        toast.success(tOrders("created"));
        resetAll();
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent variant="center" className="max-w-xl">
        <ModalHeader>
          <ModalTitle>{tOrders("new")}</ModalTitle>
          <ModalDescription>{tOrders("newDescription")}</ModalDescription>
        </ModalHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {tables.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="order-table-id"
                  className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2"
                >
                  {tOrders("table")}
                </label>
                <select
                  id="order-table-id"
                  className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink"
                  value={form.watch("table_id") ?? ""}
                  onChange={(e) => {
                    const id = e.currentTarget.value;
                    form.setValue("table_id", id);
                    const t = tables.find((tb) => tb.id === id);
                    if (t) {
                      const num = Number.parseInt(t.attributes.label.replace(/\D+/g, "") || "1", 10);
                      form.setValue("table_number", Math.min(99, Math.max(1, num)));
                    }
                  }}
                >
                  <option value="">{tOrders("noTableSelected")}</option>
                  {tables.map((tb) => (
                    <option key={tb.id} value={tb.id}>
                      {tb.attributes.label} — {tb.attributes.capacity} couv.
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <FormField
                label={tOrders("table")}
                type="number"
                min={1}
                max={99}
                required
                error={form.formState.errors.table_number?.message}
                {...form.register("table_number", { valueAsNumber: true })}
              />
            )}
            <FormField
              label={tOrders("scheduledAt")}
              type="datetime-local"
              required
              error={form.formState.errors.scheduled_at?.message}
              {...form.register("scheduled_at")}
            />
          </div>

          {reservations.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="order-reservation-id"
                className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2"
              >
                {tOrders("linkReservation")}
              </label>
              <select
                id="order-reservation-id"
                className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink"
                value={form.watch("reservation_id") ?? ""}
                onChange={(e) => form.setValue("reservation_id", e.currentTarget.value)}
              >
                <option value="">{tOrders("noReservation")}</option>
                {reservations.map((r) => {
                  const start = new Date(r.attributes.starts_at);
                  const time = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
                  const who = r.attributes.guest_name ?? "—";
                  return (
                    <option key={r.id} value={r.id}>
                      {time} · {r.attributes.table_label} · {who} ({r.attributes.party_size} couv.)
                    </option>
                  );
                })}
              </select>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-customer" className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
              {tOrders("customer")}
            </label>
            <CustomerCombobox
              id="order-customer"
              value={selectedCustomer}
              onChange={handleCustomerChange}
              invalid={Boolean(form.formState.errors.customer_id?.message)}
            />
            <input type="hidden" {...form.register("customer_id")} />
            {form.formState.errors.customer_id?.message && (
              <p className="text-[11.5px] text-neg">{form.formState.errors.customer_id.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">{tOrders("items")}</div>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-[6px] border border-line-mid bg-surface px-2 font-sans text-[12.5px] text-ink-2"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.currentTarget.value)}
                  aria-label={tOrders("filterByCategory")}
                >
                  <option value="">{tOrders("allCategories")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.attributes.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={appendLine}>
                  + {tCommon("add")}
                </Button>
              </div>
            </div>

            {lines.fields.map((field, idx) => {
              const selectedDish = selectedDishes[idx] ?? null;
              return (
                <div key={field.id} className="flex flex-col gap-2 rounded-card border border-line bg-bg p-3">
                  <div className="grid grid-cols-[1fr_72px_28px] items-end gap-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`order-dish-${idx}`}
                        className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2"
                      >
                        {tOrders("dish")}
                        <span className="ml-1 text-neg">*</span>
                      </label>
                      <DishCombobox
                        id={`order-dish-${idx}`}
                        value={selectedDish}
                        onChange={(d) => handleDishChange(idx, d)}
                        invalid={Boolean(form.formState.errors.lines?.[idx]?.dish_id?.message)}
                        categoryId={categoryFilter || null}
                      />
                      <input type="hidden" {...form.register(`lines.${idx}.dish_id` as const)} />
                      {form.formState.errors.lines?.[idx]?.dish_id?.message && (
                        <p className="text-[11.5px] text-neg">{form.formState.errors.lines[idx]?.dish_id?.message}</p>
                      )}
                    </div>
                    <FormField
                      label={tOrders("qtyShort")}
                      type="number"
                      min={1}
                      max={99}
                      required
                      error={form.formState.errors.lines?.[idx]?.qty?.message}
                      {...form.register(`lines.${idx}.qty` as const, {
                        valueAsNumber: true,
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      disabled={lines.fields.length === 1}
                      className="mb-1 inline-flex size-8 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-accent-soft hover:text-neg disabled:opacity-40"
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
                  <input
                    type="hidden"
                    {...form.register(`lines.${idx}.unit_price_cents` as const, {
                      valueAsNumber: true,
                    })}
                  />
                  {selectedDish && (
                    <div className="flex items-center justify-between font-mono text-[11.5px] text-ink-3">
                      <span>{tOrders("unitPrice")}</span>
                      <span className="text-ink-2">{formatEur(selectedDish.attributes.price_cents)}</span>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder={tOrders("lineNotesPlaceholder")}
                    maxLength={500}
                    className="h-9 w-full rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13px] text-ink placeholder:text-ink-3 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                    {...form.register(`lines.${idx}.notes` as const)}
                  />
                </div>
              );
            })}
            {form.formState.errors.lines?.message && (
              <p className="text-[11.5px] text-neg">{form.formState.errors.lines.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-notes" className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
              {tOrders("notes")}
            </label>
            <textarea
              id="order-notes"
              rows={3}
              maxLength={2000}
              placeholder={tOrders("notesPlaceholder")}
              className="flex w-full rounded-[8px] border border-line-mid bg-surface px-3 py-2 font-sans text-[13.5px] text-ink placeholder:text-ink-3 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              {...form.register("notes")}
            />
            {form.formState.errors.notes?.message && (
              <p className="text-[11.5px] text-neg">{form.formState.errors.notes.message}</p>
            )}
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending ? tCommon("saving") : tCommon("create")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
