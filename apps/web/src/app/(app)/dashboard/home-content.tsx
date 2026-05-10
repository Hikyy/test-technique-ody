"use client";

import { AreaChart, BarH, Button, DashboardTemplate, EmptyState, KpiCard, Skeleton } from "@ody/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import type { DashboardOverviewData, KpiCardData } from "@/lib/api-types";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useDashboardOverviewData } from "@/lib/hooks/use-dashboard-overview";
import { useOrders } from "@/lib/hooks/use-orders";

const KPI_SKELETON_KEYS = ["covers", "revenue", "basket", "cancel"] as const;
const RAIL_SKELETON_KEYS = ["row-1", "row-2", "row-3", "row-4", "row-5"] as const;

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatPercent(rate: number, fractionDigits = 1): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rate);
}

function formatDelta(rate: number): string {
  const sign = rate >= 0 ? "+" : "";
  return `${sign}${(rate * 100).toFixed(1)} %`;
}

function sparkPoints(kpi: KpiCardData): number[] {
  return kpi.spark.map((p) => p.value);
}

function todayLabel(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function HomeContent() {
  const tDashboard = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const userQuery = useCurrentUser();
  const { data, isLoading, isError, error, refetch } = useDashboardOverviewData();
  const recentOrdersQuery = useOrders({ pageSize: 6 });

  const headerEyebrow = useMemo(() => `${todayLabel()} · ${tCommon("eveningService")}`, [tCommon]);

  const greetingName = userQuery.data?.name?.split(" ")[0] ?? "";
  const greeting =
    new Date().getHours() >= 17
      ? tDashboard("greetingEvening", { name: greetingName })
      : tDashboard("greetingMorning", { name: greetingName });

  const header = (
    <div className="flex items-end justify-between">
      <div>
        <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{headerEyebrow}</div>
        <h1 className="mt-1.5 text-[30px] font-medium text-ink" style={{ letterSpacing: "-0.6px" }}>
          {greeting}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">{tDashboard("dailyReport")}</Button>
        <Link
          href="/orders"
          className="inline-flex h-[34px] items-center justify-center rounded-[8px] bg-ink px-[14px] text-[13px] font-medium text-bg transition-colors hover:bg-ink/90"
        >
          {tDashboard("newOrder")}
        </Link>
      </div>
    </div>
  );

  if (isLoading || !data) {
    if (isError) {
      return (
        <DashboardTemplate
          header={header}
          kpis={<KpiSkeletons />}
          hero={
            <EmptyState
              title={tDashboard("loadFailed")}
              body={(error as Error)?.message ?? tErrors("network")}
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  {tErrors("retry")}
                </Button>
              }
            />
          }
        />
      );
    }
    return (
      <DashboardTemplate header={header} kpis={<KpiSkeletons />} hero={<HeroSkeleton />} rail={<RailSkeleton />} />
    );
  }

  return (
    <DashboardTemplate
      header={header}
      kpis={<KpiCards data={data} />}
      secondary={<QuickActions />}
      hero={<HeroAreaChart data={data} />}
      rail={
        <>
          <RecentOrders orders={recentOrdersQuery.data?.items ?? []} isLoading={recentOrdersQuery.isLoading} />
          <RailContent data={data} />
        </>
      }
    />
  );
}

function KpiCards({ data }: { data: DashboardOverviewData }) {
  const tKpis = useTranslations("dashboard.kpis");
  return (
    <>
      <KpiCard
        label={tKpis("coversTonight")}
        value={String(data.couverts_du_jour.value)}
        delta={formatDelta(data.couverts_du_jour.delta)}
        deltaPos={data.couverts_du_jour.delta >= 0}
        points={sparkPoints(data.couverts_du_jour)}
      />
      <KpiCard
        label={tKpis("revenueEstimate")}
        value={formatCurrency(data.ca_estime.value)}
        delta={formatDelta(data.ca_estime.delta)}
        deltaPos={data.ca_estime.delta >= 0}
        points={sparkPoints(data.ca_estime)}
      />
      <KpiCard
        label={tKpis("averageBasket")}
        value={formatCurrency(data.panier_moyen.value)}
        delta={formatDelta(data.panier_moyen.delta)}
        deltaPos={data.panier_moyen.delta >= 0}
        points={sparkPoints(data.panier_moyen)}
      />
      <KpiCard
        label={tKpis("cancellationRate")}
        value={formatPercent(data.taux_annulation.value)}
        delta={formatDelta(data.taux_annulation.delta)}
        deltaPos={data.taux_annulation.delta <= 0}
        points={sparkPoints(data.taux_annulation)}
      />
    </>
  );
}

function HeroAreaChart({ data }: { data: DashboardOverviewData }) {
  const tDashboard = useTranslations("dashboard");
  const points = sparkPoints(data.ca_estime);
  const total = data.ca_estime.value;
  const delta = data.ca_estime.delta;

  if (points.length === 0) {
    return <EmptyState title={tDashboard("heroEmptyTitle")} body={tDashboard("heroEmptyBody")} />;
  }

  return (
    <div className="rounded-card border border-line bg-surface px-[22px] pb-4 pt-[18px]">
      <div className="mb-1.5 flex items-start justify-between">
        <div>
          <div className="text-[12px] text-ink-2">{tDashboard("revenue14d")}</div>
          <div className="mt-1.5 flex items-baseline gap-3">
            <div className="text-[28px] font-medium text-ink" style={{ letterSpacing: "-0.5px" }}>
              {formatCurrency(total)}
            </div>
            <div className={delta >= 0 ? "font-mono text-[11.5px] text-pos" : "font-mono text-[11.5px] text-neg"}>
              {delta >= 0 ? "↑" : "↓"} {formatDelta(delta)}
            </div>
          </div>
        </div>
        <div className="flex gap-1 font-mono text-[11px]">
          {(["d7", "d14", "d30", "d90"] as const).map((k, i) => (
            <span
              key={k}
              className={
                i === 1
                  ? "rounded-[6px] bg-accent-soft px-2.5 py-1 text-ink"
                  : "rounded-[6px] border border-line px-2.5 py-1 text-ink-2"
              }
            >
              {tDashboard(`ranges.${k}`)}
            </span>
          ))}
        </div>
      </div>
      <AreaChart pts={points} w={770} h={170} gradientId="ca-hero" />
      <div className="mt-1 flex justify-between font-mono text-[10.5px] text-ink-3">
        {data.ca_estime.spark.map((p) => (
          <span key={p.date}>{formatChartDate(p.date)}</span>
        ))}
      </div>
    </div>
  );
}

function RailContent({ data }: { data: DashboardOverviewData }) {
  const tDashboard = useTranslations("dashboard");
  const top = data.top_plats.map((p) => ({ label: p.name, value: p.qty }));
  const max = top.length > 0 ? Math.max(...top.map((d) => d.value)) : 1;

  return (
    <div className="rounded-card border border-line bg-surface px-5 pb-3.5 pt-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="text-[12px] text-ink-2">{tDashboard("topDishesEvening")}</div>
        <div className="font-mono text-[11px] text-ink-3">{tDashboard("top5")}</div>
      </div>
      {top.length > 0 ? (
        <BarH items={top} max={max} />
      ) : (
        <div className="py-4 text-center font-serif text-[15px] italic text-ink-3">
          Aucun plat servi pour l'instant.
        </div>
      )}
    </div>
  );
}

function KpiSkeletons() {
  return (
    <>
      {KPI_SKELETON_KEYS.map((key) => (
        <div
          key={key}
          className="flex flex-col gap-3 rounded-card border border-line bg-surface px-[22px] pt-5 pb-[18px]"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-7 w-full" />
        </div>
      ))}
    </>
  );
}

function HeroSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface px-[22px] pb-4 pt-[18px]">
      <Skeleton className="h-3.5 w-44" />
      <Skeleton className="mt-2 h-7 w-40" />
      <Skeleton className="mt-4 h-[170px] w-full" />
    </div>
  );
}

function RailSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface px-5 pb-3.5 pt-4">
      <Skeleton className="h-3.5 w-40" />
      <div className="mt-3 flex flex-col gap-2">
        {RAIL_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

function formatChartDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(iso));
}
