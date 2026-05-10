"use client";

import { Button } from "@ody/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { SettingsAttributesData } from "@/lib/hooks/use-settings";
import { useUpdateSettings } from "@/lib/hooks/use-update-settings";

interface Props {
  attributes: SettingsAttributesData;
}

export function NotificationsSection({ attributes }: Props) {
  const tSettings = useTranslations("settings");
  const update = useUpdateSettings();
  const [enabled, setEnabled] = useState(attributes.notifications_enabled);

  useEffect(() => {
    setEnabled(attributes.notifications_enabled);
  }, [attributes.notifications_enabled]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { notifications_enabled: enabled },
      {
        onSuccess: () => toast.success(tSettings("saved")),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <section className="rounded-card border border-line bg-surface px-7 py-6">
      <header className="mb-2">
        <h2 className="font-serif text-[22px] italic text-ink">{tSettings("notifications")}</h2>
        <p className="mt-1 text-[12px] text-ink-2">{tSettings("notificationsHint")}</p>
      </header>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <label className="flex items-start gap-3 border-t border-line py-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-accent"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <div>
            <div className="text-[13px] font-medium text-ink">{tSettings("notificationsEnabled")}</div>
            <div className="mt-0.5 text-[11.5px] text-ink-2">{tSettings("notificationsEnabledHint")}</div>
          </div>
        </label>

        <div className="flex justify-end pt-1">
          <Button type="submit" variant="ink" disabled={update.isPending}>
            {update.isPending ? tSettings("saving") : tSettings("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}
