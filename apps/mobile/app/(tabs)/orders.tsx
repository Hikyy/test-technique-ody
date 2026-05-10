import {
  findCustomer,
  type OrderIncludedResource,
  type OrderSearchScope,
  orderSearchScopes,
  resolveOrderLines,
  useInfiniteOrders,
} from "@ody/sdk";
import { Link, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCents, formatTime } from "../../src/lib/format";
import { useTranslations } from "../../src/lib/i18n";
import { Card } from "../../src/ui/Card";
import { EmptyState } from "../../src/ui/EmptyState";
import { FilterChips } from "../../src/ui/FilterChips";
import { SearchBar } from "../../src/ui/SearchBar";
import { Skeleton } from "../../src/ui/Skeleton";
import { type StatusKey, StatusPill } from "../../src/ui/StatusPill";

type Filter = "all" | "pending" | "cooking" | "sent" | "served";

const PAGE_SIZE = 20;
const SKELETON_KEYS = ["s1", "s2", "s3"] as const;

function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tOrders = useTranslations("orders");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<OrderSearchScope>("table");
  const [filter, setFilter] = useState<Filter>("all");
  const debouncedSearch = useDebouncedValue(search.trim());

  const STATUS_FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: tOrders("filters.all") },
    { key: "pending", label: tOrders("filters.pending") },
    { key: "cooking", label: tOrders("filters.cooking") },
    { key: "sent", label: tOrders("statuses.sentShort") },
    { key: "served", label: tOrders("statuses.servedShort") },
  ];

  const PLACEHOLDERS: Record<OrderSearchScope, string> = {
    table: tOrders("search.tablePlaceholder"),
    dish: tOrders("search.dishPlaceholder"),
    notes: tOrders("search.notesPlaceholder"),
  };

  const query = useInfiniteOrders<OrderIncludedResource>({
    status: filter === "all" ? undefined : filter,
    search: debouncedSearch || undefined,
    search_scope: scope,
    pageSize: PAGE_SIZE,
  });

  const pages = query.data?.pages ?? [];
  const items = pages.flatMap((p) => p.items);
  const included = useMemo(() => pages.flatMap((p) => p.included), [pages]);
  const total = pages[0]?.meta.total;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-3 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-sans text-[17px] font-medium text-ink">{tOrders("title")}</Text>
            {typeof total === "number" ? (
              <Text className="font-mono text-[11px] text-ink-3">
                {total} {tOrders("totalSuffix")}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tOrders("new")}
            onPress={() => router.push("/orders/new")}
            className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-80"
          >
            <Text className="font-sans text-[20px] text-bg leading-[20px]">+</Text>
          </Pressable>
        </View>

        <View className="mt-3">
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={PLACEHOLDERS[scope]}
            scopes={orderSearchScopes}
            scope={scope}
            onScopeChange={setScope}
          />
        </View>

        <View className="mt-3">
          <FilterChips options={STATUS_FILTERS} value={filter} onChange={setFilter} />
        </View>
      </View>

      {query.isLoading ? (
        <View className="px-4 gap-2.5">
          {SKELETON_KEYS.map((k) => (
            <Skeleton key={k} height={88} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={<EmptyState title={tOrders("emptyTitle")} subtitle={tOrders("emptyForFilters")} />}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator />
              </View>
            ) : null
          }
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => query.refetch()}
            />
          }
          renderItem={({ item }) => {
            const lines = resolveOrderLines(item.relationships.lines.data, included);
            const covers = lines.reduce((s, l) => s + l.qty, 0);
            const ref = item.relationships.customer.data;
            const customer = ref ? findCustomer(included, ref.id) : undefined;
            const customerName = customer
              ? `${customer.attributes.last_name} ${customer.attributes.first_name}`.trim()
              : null;
            const summary =
              lines.length === 0
                ? tOrders("summaryNoItems")
                : lines
                    .slice(0, 2)
                    .map((l) => `${l.qty}× ${l.dishName}`)
                    .join(" · ") + (lines.length > 2 ? ` +${lines.length - 2}` : "");

            return (
              <Link href={`/orders/${item.id}`} asChild>
                <Pressable accessibilityRole="link" className="mb-2.5 active:opacity-70">
                  <Card>
                    <View className="flex-row items-baseline justify-between">
                      <Text className="font-mono text-[12px] text-accent">
                        T.{item.attributes.table_number} · {covers} {tOrders("coversShort")}
                      </Text>
                      <StatusPill status={item.attributes.status as StatusKey} />
                    </View>
                    <Text className="mt-2 font-sans text-[15px] text-ink" numberOfLines={1}>
                      {summary}
                    </Text>
                    {customerName ? (
                      <Text className="mt-0.5 font-sans text-[12px] text-ink-2" numberOfLines={1}>
                        {customerName}
                      </Text>
                    ) : null}
                    <View className="mt-2.5 flex-row items-center justify-between border-t border-line pt-2.5">
                      <Text className="font-mono text-[11.5px] text-ink-2">
                        {formatTime(item.attributes.scheduled_at)}
                      </Text>
                      <Text className="font-mono text-[14px] font-medium text-ink">
                        {formatCents(item.attributes.total_cents)}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              </Link>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
