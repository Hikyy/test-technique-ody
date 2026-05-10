"use client";

import { type TableData, useCreateTable, useDeleteTable, useTables, useUpdateTable } from "@ody/sdk";
import { Button, FormField } from "@ody/ui";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function TablesSection() {
  const t = useTranslations("tables");
  const tCommon = useTranslations("common");
  const tablesQ = useTables();
  const create = useCreateTable();
  const update = useUpdateTable();
  const del = useDeleteTable();

  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState(2);

  const items = (tablesQ.data?.items ?? []) as TableData[];

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    create.mutate(
      { label: label.trim(), capacity, position: items.length },
      {
        onSuccess: () => {
          setLabel("");
          setCapacity(2);
          toast.success(t("created"));
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const onUpdateCapacity = (id: string, newCapacity: number) => {
    update.mutate(
      { id, patch: { capacity: newCapacity } },
      {
        onSuccess: () => toast.success(t("updated")),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const onDelete = (id: string, lbl: string) => {
    if (!confirm(t("confirmDelete", { label: lbl }))) return;
    del.mutate(id, {
      onSuccess: () => toast.success(t("deleted")),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface px-7 py-6">
      <div>
        <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{t("eyebrow")}</div>
        <h2 className="mt-1.5 font-serif text-[22px] italic text-ink">{t("title")}</h2>
        <p className="mt-1 text-[12.5px] text-ink-2">{t("hint")}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-ink-3">{t("empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-card border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-bg/40 text-[11.5px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 font-medium">{t("col.label")}</th>
                <th className="px-3 py-2 font-medium">{t("col.capacity")}</th>
                <th className="px-3 py-2 text-right font-medium">{tCommon("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tb) => (
                <tr key={tb.id} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-2 text-ink">{tb.attributes.label}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      defaultValue={tb.attributes.capacity}
                      onBlur={(e) => {
                        const v = Number.parseInt(e.currentTarget.value, 10);
                        if (v && v !== tb.attributes.capacity) onUpdateCapacity(tb.id, v);
                      }}
                      className="h-8 w-20 rounded-[6px] border border-line-mid bg-bg px-2 text-[13px] text-ink"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(tb.id, tb.attributes.label)}
                      className="inline-flex items-center gap-1 rounded-[6px] border border-line bg-bg px-2 py-1 text-[11.5px] text-neg hover:bg-neg/10"
                    >
                      <Trash2 className="size-3" /> {tCommon("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        onSubmit={onCreate}
        className="flex flex-col gap-3 rounded-card border border-line bg-bg/40 p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <FormField
            label={t("col.label")}
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            placeholder={t("labelPlaceholder")}
          />
        </div>
        <div className="w-full sm:w-32">
          <FormField
            label={t("col.capacity")}
            type="number"
            min={1}
            max={50}
            value={capacity}
            onChange={(e) => setCapacity(Number.parseInt(e.currentTarget.value || "2", 10))}
          />
        </div>
        <Button type="submit" variant="ink" disabled={!label.trim() || create.isPending}>
          <Plus className="mr-1 size-3.5" /> {tCommon("add")}
        </Button>
      </form>
    </section>
  );
}
