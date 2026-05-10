import { type OrderIncludedResource, useCurrentUser, useDashboardOverview, useOrders } from "@ody/sdk";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCents, formatDateLong, formatTime } from "../../src/lib/format";
import { useTranslations } from "../../src/lib/i18n";
import { Card } from "../../src/ui/Card";
import { EmptyState } from "../../src/ui/EmptyState";
import { KpiCard } from "../../src/ui/KpiCard";
import { Skeleton } from "../../src/ui/Skeleton";
import { type StatusKey, StatusPill } from "../../src/ui/StatusPill";

function pct(delta: number): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "" : "";
  return `${sign}${(delta * 100).toFixed(1).replace(".", ",")} %`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tDashboard = useTranslations("dashboard");
  const overview = useDashboardOverview();
  const orders = useOrders<OrderIncludedResource>({ pageSize: 5 });
  const me = useCurrentUser();

  const kpis = overview.data?.attributes;
  const live = orders.data?.items ?? [];
  const totalOrders = typeof orders.data?.meta.total === "number" ? orders.data.meta.total : live.length;
  const firstName = me.data?.attributes.name?.split(" ")[0] ?? "";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-3 pb-4">
        <View className="flex-row items-baseline justify-between">
          <Text className="font-sans text-[11px] uppercase tracking-wider text-ink-3">{formatDateLong()}</Text>
          <Link href="/settings" asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={tDashboard("settings")}>
              <Text className="font-sans text-[12px] text-ink-2">{tDashboard("settings")}</Text>
            </Pressable>
          </Link>
        </View>
        <Text className="mt-2 font-serif text-[38px] leading-[40px] tracking-tight text-ink">
          {tDashboard("hello")}
          {firstName ? (
            <>
              {" "}
              <Text className="italic text-accent">{firstName}</Text>
            </>
          ) : null}
          .
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {overview.isLoading || !kpis ? (
            <>
              <View className="w-[48%]">
                <Skeleton height={92} />
              </View>
              <View className="w-[48%]">
                <Skeleton height={92} />
              </View>
              <View className="w-[48%]">
                <Skeleton height={92} />
              </View>
              <View className="w-[48%]">
                <Skeleton height={92} />
              </View>
            </>
          ) : (
            <>
              <View className="w-[48%]">
                <KpiCard
                  label={tDashboard("kpis.coversShort")}
                  value={String(kpis.couverts_du_jour.value)}
                  delta={pct(kpis.couverts_du_jour.delta)}
                  points={kpis.couverts_du_jour.spark.map((p) => p.value)}
                />
              </View>
              <View className="w-[48%]">
                <KpiCard
                  label={tDashboard("kpis.revenueShort")}
                  value={formatCents(kpis.ca_estime.value)}
                  delta={pct(kpis.ca_estime.delta)}
                  points={kpis.ca_estime.spark.map((p) => p.value)}
                />
              </View>
              <View className="w-[48%]">
                <KpiCard
                  label={tDashboard("kpis.basketShort")}
                  value={formatCents(kpis.panier_moyen.value)}
                  delta={pct(kpis.panier_moyen.delta)}
                  points={kpis.panier_moyen.spark.map((p) => p.value)}
                />
              </View>
              <View className="w-[48%]">
                <KpiCard
                  label={tDashboard("kpis.cancellationShort")}
                  value={`${(kpis.taux_annulation.value * 100).toFixed(1).replace(".", ",")} %`}
                  delta={pct(kpis.taux_annulation.delta)}
                  points={kpis.taux_annulation.spark.map((p) => p.value)}
                />
              </View>
            </>
          )}
        </View>

        <View className="mt-6 flex-row items-baseline justify-between">
          <Text className="font-sans text-[13px] font-medium text-ink">{tDashboard("serviceActivity")}</Text>
          <Text className="font-mono text-[11px] text-ink-2">{totalOrders}</Text>
        </View>

        <View className="mt-3 gap-2">
          {orders.isLoading ? (
            <>
              <Skeleton height={70} />
              <Skeleton height={70} />
              <Skeleton height={70} />
            </>
          ) : live.length === 0 ? (
            <EmptyState
              title={tDashboard("recentOrders.emptyShort")}
              subtitle={tDashboard("recentOrders.emptySubtitle")}
            />
          ) : (
            live.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} asChild>
                <Pressable accessibilityRole="link">
                  <Card>
                    <View className="flex-row items-baseline justify-between">
                      <Text className="font-mono text-[12px] text-accent">T.{o.attributes.table_number}</Text>
                      <StatusPill status={o.attributes.status as StatusKey} />
                    </View>
                    <View className="mt-2 flex-row items-baseline justify-between">
                      <Text className="font-mono text-[11.5px] text-ink-2">
                        {formatTime(o.attributes.scheduled_at)}
                      </Text>
                      <Text className="font-mono text-[14px] font-medium text-ink">
                        {formatCents(o.attributes.total_cents)}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              </Link>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
