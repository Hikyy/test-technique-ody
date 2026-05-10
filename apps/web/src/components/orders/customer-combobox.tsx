"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
import { AsyncCombobox } from "@/components/ui/async-combobox";
import { apiList } from "@/lib/api-client";
import type { CustomerData } from "@/lib/hooks/use-customers";

interface CustomerComboboxProps {
  value: CustomerData | null;
  onChange: (value: CustomerData | null) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
}

function initials(c: CustomerData): string {
  const f = c.attributes.first_name?.[0] ?? "";
  const l = c.attributes.last_name?.[0] ?? "";
  return `${l}${f}`.toUpperCase() || "?";
}

export function CustomerCombobox({ value, onChange, id, invalid, disabled }: CustomerComboboxProps) {
  const tOrders = useTranslations("orders");
  const tCustomers = useTranslations("customers");
  const [createOpen, setCreateOpen] = useState(false);

  const fetchItems = useCallback(async (search: string, page: number) => {
    const query: Record<string, string | number> = { page, pageSize: 20 };
    if (search.length >= 2) query.search = search;
    const res = await apiList<CustomerData>("/api/customers", { query });
    const total = typeof res.meta.total === "number" ? res.meta.total : res.items.length;
    return { items: res.items, total };
  }, []);

  return (
    <>
      <AsyncCombobox<CustomerData>
        id={id}
        value={value}
        onChange={onChange}
        fetchItems={fetchItems}
        itemKey={(c) => c.id}
        itemLabel={(c) => `${c.attributes.last_name} ${c.attributes.first_name}`.trim()}
        renderItem={(c) => (
          <span className="flex items-center gap-2.5">
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[10.5px] font-medium text-accent">
              {initials(c)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-sans text-[13px] text-ink">
                {c.attributes.last_name} {c.attributes.first_name}
              </span>
              {c.attributes.email && (
                <span className="truncate font-mono text-[11px] text-ink-3">{c.attributes.email}</span>
              )}
            </span>
          </span>
        )}
        placeholder={tOrders("pickCustomer")}
        searchPlaceholder={tOrders("searchCustomer")}
        allowEmpty
        emptyLabel={tOrders("noneCustomerShort")}
        invalid={invalid}
        disabled={disabled}
        footerSlot={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left font-sans text-[13px] text-accent transition-colors hover:bg-accent-soft"
          >
            <span aria-hidden className="text-[14px] leading-none">
              +
            </span>
            <span>{tCustomers("new")}</span>
          </button>
        }
      />

      <CustomerFormModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(c) => onChange(c)} />
    </>
  );
}
