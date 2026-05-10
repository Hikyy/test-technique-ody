"use client";

import type { ReservationData, ReservationStatus, TableData } from "@ody/sdk";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface Props {
  tables: TableData[];
  reservations: ReservationData[];
  date: Date;
  onEdit: (r: ReservationData) => void;
  onStatus: (r: ReservationData, status: ReservationStatus) => void;
}

const STATUS_COLOR: Record<ReservationStatus, string> = {
  pending: "bg-amber-50 border-amber-300 text-amber-900",
  confirmed: "bg-emerald-50 border-emerald-300 text-emerald-900",
  seated: "bg-sky-50 border-sky-300 text-sky-900",
  completed: "bg-ink/5 border-line text-ink-2 line-through",
  cancelled: "bg-rose-50 border-rose-300 text-rose-900 line-through",
  no_show: "bg-zinc-100 border-zinc-300 text-zinc-700 line-through",
};

const SLOT_HEIGHT = 28; // px per 30 min slot
const START_HOUR = 11;
const END_HOUR = 24;
const SLOTS = (END_HOUR - START_HOUR) * 2;

function timeOf(d: Date): { h: number; m: number } {
  return { h: d.getHours(), m: d.getMinutes() };
}

function offsetSlots(d: Date): number {
  const { h, m } = timeOf(d);
  return Math.max(0, (h - START_HOUR) * 2 + Math.floor(m / 30));
}

function spanSlots(start: Date, end: Date): number {
  const startSlot = offsetSlots(start);
  const endSlot = Math.ceil(((end.getHours() - START_HOUR) * 60 + end.getMinutes()) / 30);
  return Math.max(1, endSlot - startSlot);
}

export function ReservationsCardView({ tables, reservations, date: _date, onEdit, onStatus }: Props) {
  const tCommon = useTranslations("common");
  const t = useTranslations("reservations");

  const byTable = useMemo(() => {
    const m = new Map<string, ReservationData[]>();
    for (const r of reservations) {
      const arr = m.get(r.attributes.table_id) ?? [];
      arr.push(r);
      m.set(r.attributes.table_id, arr);
    }
    return m;
  }, [reservations]);

  if (tables.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-6 text-center text-[13px] text-ink-3">
        {tCommon("empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <div className="flex min-w-max">
        {/* Time column */}
        <div className="sticky left-0 z-10 flex flex-col border-r border-line bg-surface" style={{ width: 64 }}>
          <div className="h-12 border-b border-line text-[10.5px] uppercase tracking-wider text-ink-3 flex items-end justify-end px-2 pb-1.5">
            {t("hours")}
          </div>
          {Array.from({ length: SLOTS }, (_, i) => i).map((i) => {
            const minutes = i * 30;
            const h = START_HOUR + Math.floor(minutes / 60);
            const m = minutes % 60;
            return (
              <div
                key={`slot-label-${h}-${m}`}
                className={`flex items-start justify-end pr-2 text-[10px] tabular-nums text-ink-3 ${m === 0 ? "" : "opacity-50"}`}
                style={{ height: SLOT_HEIGHT }}
              >
                {m === 0 ? `${h.toString().padStart(2, "0")}:00` : ""}
              </div>
            );
          })}
        </div>

        {/* Tables columns */}
        {tables.map((tbl) => {
          const items = (byTable.get(tbl.id) ?? [])
            .slice()
            .sort((a, b) => (a.attributes.starts_at < b.attributes.starts_at ? -1 : 1));

          return (
            <div key={tbl.id} className="relative flex flex-col border-r border-line" style={{ width: 200 }}>
              <div className="sticky top-0 z-10 flex h-12 flex-col items-start justify-center border-b border-line bg-surface px-3">
                <div className="text-[12.5px] font-medium text-ink">{tbl.attributes.label}</div>
                <div className="flex items-center gap-1 text-[10.5px] text-ink-3">
                  <Users className="size-3" /> {tbl.attributes.capacity}
                </div>
              </div>

              {/* Grid lines */}
              <div className="relative" style={{ height: SLOTS * SLOT_HEIGHT }}>
                {Array.from({ length: SLOTS }, (_, i) => i).map((i) => (
                  <div
                    key={`grid-${tbl.id}-${i}`}
                    className={`absolute left-0 right-0 ${i % 2 === 0 ? "border-t border-line/70" : "border-t border-line/30"}`}
                    style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                  />
                ))}

                {/* Reservation cards */}
                {items.map((r) => {
                  const start = new Date(r.attributes.starts_at);
                  const end = new Date(r.attributes.ends_at);
                  const top = offsetSlots(start) * SLOT_HEIGHT;
                  const height = spanSlots(start, end) * SLOT_HEIGHT - 2;
                  const cls = STATUS_COLOR[r.attributes.status];
                  const display = r.attributes.guest_name ?? "—";
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onEdit(r)}
                      className={`absolute left-1 right-1 overflow-hidden rounded-[6px] border ${cls} text-left text-[11.5px] leading-tight shadow-sm transition-transform hover:-translate-y-px`}
                      style={{ top, height }}
                    >
                      <div className="flex items-start justify-between gap-1 px-1.5 pt-1">
                        <span className="truncate font-medium">{display}</span>
                        <span className="shrink-0 tabular-nums opacity-70">{`${start.getHours()}:${String(start.getMinutes()).padStart(2, "0")}`}</span>
                      </div>
                      <div className="flex items-center justify-between px-1.5">
                        <span className="opacity-80">
                          {r.attributes.party_size} {t("pax")}
                        </span>
                        {r.attributes.status === "pending" ? (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatus(r, "confirmed");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                onStatus(r, "confirmed");
                              }
                            }}
                            className="cursor-pointer rounded bg-white/70 px-1 text-[10px] hover:bg-white"
                          >
                            ✓
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
