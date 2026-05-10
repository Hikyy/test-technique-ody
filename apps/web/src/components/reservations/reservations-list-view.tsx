"use client";

import type { ReservationData, ReservationStatus } from "@ody/sdk";
import { useTranslations } from "next-intl";

interface Props {
  reservations: ReservationData[];
  onEdit: (r: ReservationData) => void;
  onStatus: (r: ReservationData, status: ReservationStatus) => void;
}

const STATUS_BADGE: Record<ReservationStatus, string> = {
  pending: "bg-amber-50 text-amber-900 border-amber-300",
  confirmed: "bg-emerald-50 text-emerald-900 border-emerald-300",
  seated: "bg-sky-50 text-sky-900 border-sky-300",
  completed: "bg-ink/5 text-ink-2 border-line",
  cancelled: "bg-rose-50 text-rose-900 border-rose-300",
  no_show: "bg-zinc-100 text-zinc-700 border-zinc-300",
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ReservationsListView({ reservations, onEdit, onStatus }: Props) {
  const t = useTranslations("reservations");
  const tStatus = useTranslations("reservations.status");

  if (reservations.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-6 text-center text-[13px] text-ink-3">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-line bg-bg/40 text-[11.5px] uppercase tracking-wider text-ink-3">
          <tr>
            <th className="px-4 py-2.5 font-medium">{t("col.time")}</th>
            <th className="px-4 py-2.5 font-medium">{t("col.who")}</th>
            <th className="px-4 py-2.5 font-medium">{t("col.party")}</th>
            <th className="px-4 py-2.5 font-medium">{t("col.table")}</th>
            <th className="px-4 py-2.5 font-medium">{t("col.status")}</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => {
            const a = r.attributes;
            return (
              <tr key={r.id} className="border-b border-line/70 last:border-0 hover:bg-bg/40">
                <td className="px-4 py-3 tabular-nums text-ink">
                  {fmtTime(a.starts_at)} — {fmtTime(a.ends_at)}
                </td>
                <td className="px-4 py-3 text-ink">
                  {a.guest_name ?? "—"}
                  {a.guest_phone ? (
                    <span className="ml-2 font-mono text-[11.5px] text-ink-3">{a.guest_phone}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 tabular-nums text-ink">{a.party_size}</td>
                <td className="px-4 py-3 text-ink">{a.table_label}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${STATUS_BADGE[a.status]}`}>
                    {tStatus(a.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    {a.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => onStatus(r, "confirmed")}
                        className="rounded-[6px] border border-line bg-bg px-2 py-1 text-[11.5px] text-ink hover:bg-accent-soft"
                      >
                        {tStatus("confirmed")}
                      </button>
                    )}
                    {a.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => onStatus(r, "seated")}
                        className="rounded-[6px] border border-line bg-bg px-2 py-1 text-[11.5px] text-ink hover:bg-accent-soft"
                      >
                        {tStatus("seated")}
                      </button>
                    )}
                    {a.status === "seated" && (
                      <button
                        type="button"
                        onClick={() => onStatus(r, "completed")}
                        className="rounded-[6px] border border-line bg-bg px-2 py-1 text-[11.5px] text-ink hover:bg-accent-soft"
                      >
                        {tStatus("completed")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      className="rounded-[6px] border border-line bg-bg px-2 py-1 text-[11.5px] text-ink hover:bg-accent-soft"
                    >
                      {t("edit")}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
