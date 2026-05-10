"use client";

import { Button } from "@ody/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DayHours, SettingsAttributesData, WeekSchedule } from "@/lib/hooks/use-settings";
import { useUpdateSettings } from "@/lib/hooks/use-update-settings";

const DAYS: Array<keyof WeekSchedule> = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface Props {
  attributes: SettingsAttributesData;
}

export function HoursSection({ attributes }: Props) {
  const tSettings = useTranslations("settings");
  const tDays = useTranslations("settings.days");
  const update = useUpdateSettings();
  const [schedule, setSchedule] = useState<WeekSchedule>(attributes.opening_hours);

  useEffect(() => {
    setSchedule(attributes.opening_hours);
  }, [attributes.opening_hours]);

  const setDay = (day: keyof WeekSchedule, value: DayHours) => {
    setSchedule((prev) => ({ ...prev, [day]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { opening_hours: schedule },
      {
        onSuccess: () => toast.success(tSettings("saved")),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <section className="rounded-card border border-line bg-surface px-7 py-6">
      <header className="mb-2">
        <h2 className="font-serif text-[22px] italic text-ink">{tSettings("hours")}</h2>
        <p className="mt-1 text-[12px] text-ink-2">{tSettings("hoursHint")}</p>
      </header>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2">
        {DAYS.map((day) => {
          const hours = schedule[day];
          const closed = hours === null;
          return (
            <div
              key={day}
              className="grid grid-cols-[120px_80px_1fr_1fr] items-center gap-3 border-t border-line py-2.5 first:border-t-0"
            >
              <div className="text-[13px] text-ink-2">{tDays(day)}</div>
              <label className="flex items-center gap-2 text-[12px] text-ink-2">
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={closed}
                  onChange={(e) => setDay(day, e.target.checked ? null : { open_at: "12:00", close_at: "14:00" })}
                />
                {tSettings("closed")}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.04em] text-ink-3">{tSettings("openAt")}</span>
                <input
                  type="time"
                  disabled={closed}
                  value={hours?.open_at ?? ""}
                  onChange={(e) => hours && setDay(day, { ...hours, open_at: e.target.value })}
                  className="h-9 rounded-[8px] border border-line-mid bg-surface px-2 font-mono text-[12.5px] text-ink disabled:opacity-40 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.04em] text-ink-3">{tSettings("closeAt")}</span>
                <input
                  type="time"
                  disabled={closed}
                  value={hours?.close_at ?? ""}
                  onChange={(e) => hours && setDay(day, { ...hours, close_at: e.target.value })}
                  className="h-9 rounded-[8px] border border-line-mid bg-surface px-2 font-mono text-[12.5px] text-ink disabled:opacity-40 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                />
              </div>
            </div>
          );
        })}
        <div className="flex justify-end pt-3">
          <Button type="submit" variant="ink" disabled={update.isPending}>
            {update.isPending ? tSettings("saving") : tSettings("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}
