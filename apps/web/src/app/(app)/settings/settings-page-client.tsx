"use client";

import { Skeleton } from "@ody/ui";
import { useTranslations } from "next-intl";
import { HoursSection } from "@/components/settings/hours-section";
import { IdentitySection } from "@/components/settings/identity-section";
import { InvitationsSection } from "@/components/settings/invitations-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { TablesSection } from "@/components/settings/tables-section";
import { useSettings } from "@/lib/hooks/use-settings";

export function SettingsPageClient() {
  const tSettings = useTranslations("settings");
  const tErrors = useTranslations("errors");
  const { data, isLoading, isError, error } = useSettings();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{tSettings("eyebrow")}</div>
        <h1 className="mt-1.5 font-serif text-[40px] italic text-ink" style={{ letterSpacing: "-0.5px" }}>
          {tSettings("title")}
        </h1>
      </header>

      {isLoading || !data ? (
        isError ? (
          <div className="rounded-card border border-neg/30 bg-neg/5 p-4 text-[13px] text-neg">
            {(error as Error)?.message ?? tErrors("generic")}
          </div>
        ) : (
          <SectionSkeletons />
        )
      ) : (
        <div className="flex flex-col gap-4">
          <IdentitySection attributes={data.attributes} />
          <HoursSection attributes={data.attributes} />
          <TablesSection />
          <NotificationsSection attributes={data.attributes} />
          <InvitationsSection />
        </div>
      )}
    </div>
  );
}

function SectionSkeletons() {
  return (
    <div className="flex flex-col gap-4">
      {["identity", "hours", "notifications"].map((k) => (
        <div key={k} className="flex flex-col gap-4 rounded-card border border-line bg-surface px-7 py-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
