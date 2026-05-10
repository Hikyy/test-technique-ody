"use client";

import {
  ApiError,
  type CreateReservationDTO,
  type ReservationData,
  type TableData,
  useCreateReservation,
  useCustomer,
  useUpdateReservation,
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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CustomerCombobox } from "@/components/orders/customer-combobox";
import type { CustomerData } from "@/lib/hooks/use-customers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: TableData[];
  defaultDate: Date;
  reservation?: ReservationData | null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function localDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function localTimeInput(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function combine(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

export function ReservationFormModal({ open, onOpenChange, tables, defaultDate, reservation }: Props) {
  const t = useTranslations("reservations");
  const tCommon = useTranslations("common");
  const create = useCreateReservation();
  const update = useUpdateReservation();
  const isEdit = Boolean(reservation);

  const [tableId, setTableId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [partySize, setPartySize] = useState(2);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [notes, setNotes] = useState("");

  // Hydrate customer from reservation.customer_id when editing.
  const editingCustomerId = isEdit ? (reservation?.attributes.customer_id ?? undefined) : undefined;
  const editingCustomer = useCustomer(editingCustomerId);

  useEffect(() => {
    if (!open) return;
    if (reservation) {
      const start = new Date(reservation.attributes.starts_at);
      const end = new Date(reservation.attributes.ends_at);
      setTableId(reservation.attributes.table_id);
      setDate(localDateInput(start));
      setStartTime(localTimeInput(start));
      setEndTime(localTimeInput(end));
      setPartySize(reservation.attributes.party_size);
      setNotes(reservation.attributes.notes ?? "");
    } else {
      setTableId(tables[0]?.id ?? "");
      setDate(localDateInput(defaultDate));
      setStartTime("19:00");
      setEndTime("21:00");
      setPartySize(2);
      setCustomer(null);
      setNotes("");
    }
  }, [open, reservation, tables, defaultDate]);

  // When editing, sync the loaded customer once available.
  useEffect(() => {
    if (open && isEdit && editingCustomer.data) {
      setCustomer(editingCustomer.data as CustomerData);
    }
    if (open && isEdit && !editingCustomerId) {
      setCustomer(null);
    }
  }, [open, isEdit, editingCustomer.data, editingCustomerId]);

  const selectedTable = useMemo(() => tables.find((tb) => tb.id === tableId), [tables, tableId]);
  const overCapacity = selectedTable && partySize > selectedTable.attributes.capacity;

  const friendlyError = (err: Error): { text1: string; text2?: string } => {
    if (err instanceof ApiError) {
      if (err.code === "TABLE_BUSY") return { text1: t("tableBusy"), text2: t("tableBusyHint") };
      if (err.code === "OVER_CAPACITY") {
        return { text1: t("overCapacity", { capacity: selectedTable?.attributes.capacity ?? 0 }) };
      }
    }
    return { text1: err.message };
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableId || !date || !startTime || !endTime) return;
    if (!customer) {
      toast.error(t("customerRequired"));
      return;
    }
    if (overCapacity) {
      toast.error(t("overCapacity", { capacity: selectedTable?.attributes.capacity ?? 0 }));
      return;
    }
    const startsAt = combine(date, startTime);
    const endsAt = combine(date, endTime);
    if (endsAt <= startsAt) {
      toast.error(t("invalidRange"));
      return;
    }
    const payload: CreateReservationDTO = {
      table_id: tableId,
      customer_id: customer.id,
      // Mirror the customer name on guest_name so list views always show something
      // even when the customer record is later removed.
      guest_name: `${customer.attributes.last_name} ${customer.attributes.first_name}`.trim(),
      guest_phone: customer.attributes.phone ?? null,
      party_size: partySize,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      notes: notes.trim() ? notes.trim() : null,
    };

    if (isEdit && reservation) {
      update.mutate(
        { id: reservation.id, patch: payload },
        {
          onSuccess: () => {
            toast.success(t("updated"));
            onOpenChange(false);
          },
          onError: (err) => {
            const { text1, text2 } = friendlyError(err);
            toast.error(text1, text2 ? { description: text2 } : undefined);
          },
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: () => {
        toast.success(t("created"));
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const pending = create.isPending || update.isPending;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent variant="center" className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{isEdit ? t("editTitle") : t("newTitle")}</ModalTitle>
          <ModalDescription>{t("formDescription")}</ModalDescription>
        </ModalHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="resa-table" className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
              {t("table")}
            </label>
            <select
              id="resa-table"
              value={tableId}
              onChange={(e) => setTableId(e.currentTarget.value)}
              className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink"
              required
            >
              {tables.map((tb) => (
                <option key={tb.id} value={tb.id}>
                  {tb.attributes.label} — {tb.attributes.capacity} {t("pax")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField
              label={t("date")}
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
            />
            <FormField
              label={t("from")}
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.currentTarget.value)}
            />
            <FormField
              label={t("to")}
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.currentTarget.value)}
            />
          </div>

          <FormField
            label={t("partySize")}
            type="number"
            required
            min={1}
            max={selectedTable?.attributes.capacity ?? 50}
            value={partySize}
            onChange={(e) => setPartySize(Number.parseInt(e.currentTarget.value || "1", 10))}
            error={overCapacity ? t("overCapacity", { capacity: selectedTable?.attributes.capacity ?? 0 }) : undefined}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="resa-customer" className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
              {t("customer")}
              <span className="ml-1 text-neg">*</span>
            </label>
            <CustomerCombobox id="resa-customer" value={customer} onChange={setCustomer} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="resa-notes" className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
              {t("notes")}
            </label>
            <textarea
              id="resa-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              className="rounded-[8px] border border-line-mid bg-surface px-3 py-2 font-sans text-[13.5px] text-ink placeholder:text-ink-3 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={pending || Boolean(overCapacity) || !customer}>
              {pending ? t("saving") : isEdit ? tCommon("save") : tCommon("create")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
