"use client";

import {
  ApiError,
  type ReservationData,
  type TableData,
  useReservations,
  useTables,
  useUpdateReservation,
} from "@ody/sdk";
import { Button } from "@ody/ui";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ReservationFormModal } from "@/components/reservations/reservation-form-modal";
import { ReservationsCardView } from "@/components/reservations/reservations-card-view";
import { ReservationsListView } from "@/components/reservations/reservations-list-view";

type View = "card" | "list";

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function formatDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ReservationsPageClient() {
  const t = useTranslations("reservations");
  const tCommon = useTranslations("common");

  const [view, setView] = useState<View>("card");
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationData | null>(null);

  const from = useMemo(() => date.toISOString(), [date]);
  const to = useMemo(() => addDays(date, 1).toISOString(), [date]);

  const tablesQ = useTables();
  const reservationsQ = useReservations({ from, to });
  const update = useUpdateReservation();

  const tables = (tablesQ.data?.items ?? []) as TableData[];
  const reservations = (reservationsQ.data?.items ?? []) as ReservationData[];

  const handleStatus = (r: ReservationData, status: ReservationData["attributes"]["status"]) => {
    update.mutate(
      { id: r.id, patch: { status } },
      {
        onSuccess: () => toast.success(t("statusUpdated")),
        onError: (err) => {
          if (err instanceof ApiError && err.code === "TABLE_BUSY") {
            toast.error(t("tableBusy"), { description: t("tableBusyHint") });
          } else {
            toast.error(err.message);
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{t("eyebrow")}</div>
          <h1 className="mt-1 font-serif text-[36px] italic text-ink" style={{ letterSpacing: "-0.4px" }}>
            {t("title")}
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-2">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDate((d) => addDays(d, -1))}
            className="rounded-card border border-line bg-surface px-2.5 py-2 text-[13px] text-ink hover:bg-bg"
          >
            ←
          </button>
          <input
            type="date"
            value={formatDateInput(date)}
            onChange={(e) => setDate(startOfDay(new Date(e.currentTarget.value)))}
            className="rounded-card border border-line-mid bg-surface px-3 py-2 font-sans text-[13px] text-ink"
          />
          <button
            type="button"
            onClick={() => setDate(startOfDay(new Date()))}
            className="rounded-card border border-line bg-surface px-3 py-2 text-[13px] text-ink hover:bg-bg"
          >
            {tCommon("today")}
          </button>
          <button
            type="button"
            onClick={() => setDate((d) => addDays(d, 1))}
            className="rounded-card border border-line bg-surface px-2.5 py-2 text-[13px] text-ink hover:bg-bg"
          >
            →
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-card border border-line bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setView("card")}
            className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12.5px] transition-colors ${
              view === "card" ? "bg-ink text-bg" : "text-ink-2 hover:bg-bg"
            }`}
          >
            <LayoutGrid className="size-3.5" /> {t("viewCard")}
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12.5px] transition-colors ${
              view === "list" ? "bg-ink text-bg" : "text-ink-2 hover:bg-bg"
            }`}
          >
            <List className="size-3.5" /> {t("viewList")}
          </button>
        </div>

        <Button variant="ink" onClick={() => setCreateOpen(true)} disabled={tables.length === 0}>
          <Plus className="mr-1 size-3.5" /> {t("new")}
        </Button>
      </div>

      {tables.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-6 text-center">
          <p className="text-[13.5px] text-ink-2">{t("noTablesYet")}</p>
          <p className="mt-1 text-[12.5px] text-ink-3">{t("noTablesHint")}</p>
        </div>
      ) : reservationsQ.isLoading ? (
        <div className="rounded-card border border-line bg-surface p-6 text-center text-[13px] text-ink-3">
          {tCommon("loading")}
        </div>
      ) : view === "card" ? (
        <ReservationsCardView
          tables={tables}
          reservations={reservations}
          date={date}
          onEdit={setEditing}
          onStatus={handleStatus}
        />
      ) : (
        <ReservationsListView reservations={reservations} onEdit={setEditing} onStatus={handleStatus} />
      )}

      <ReservationFormModal open={createOpen} onOpenChange={setCreateOpen} tables={tables} defaultDate={date} />

      <ReservationFormModal
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        tables={tables}
        defaultDate={date}
        reservation={editing}
      />
    </div>
  );
}
