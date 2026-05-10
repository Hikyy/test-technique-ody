import { type CustomerSearchScope, customerSearchScopes, useInfiniteCustomers } from "@ody/sdk";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCents } from "../../src/lib/format";
import { useTranslations } from "../../src/lib/i18n";
import { Avatar } from "../../src/ui/Avatar";
import { Card } from "../../src/ui/Card";
import { EmptyState } from "../../src/ui/EmptyState";
import { SearchBar } from "../../src/ui/SearchBar";
import { Skeleton } from "../../src/ui/Skeleton";

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

export default function CustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tCustomers = useTranslations("customers");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<CustomerSearchScope>("name");
  const debouncedSearch = useDebouncedValue(search.trim());

  const PLACEHOLDERS: Record<CustomerSearchScope, string> = {
    name: tCustomers("search.namePlaceholder"),
    email: tCustomers("search.emailPlaceholder"),
    phone: tCustomers("search.phonePlaceholder"),
  };

  const query = useInfiniteCustomers({
    search: debouncedSearch || undefined,
    search_scope: scope,
    pageSize: PAGE_SIZE,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.meta.total;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-3 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="font-sans text-[17px] font-medium text-ink">{tCustomers("title")}</Text>
          {typeof total === "number" ? (
            <Text className="font-mono text-[11px] text-ink-3">
              {total} {tCustomers("totalSuffix")}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tCustomers("new")}
          onPress={() => router.push("/customers/new")}
          className="size-10 rounded-full bg-ink items-center justify-center active:opacity-80"
        >
          <Text className="font-sans text-[20px] text-bg leading-[20px]">+</Text>
        </Pressable>
      </View>

      <View className="px-5 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={PLACEHOLDERS[scope]}
          scopes={customerSearchScopes}
          scope={scope}
          onScopeChange={setScope}
        />
      </View>

      {query.isLoading ? (
        <View className="px-4 gap-2.5">
          {SKELETON_KEYS.map((k) => (
            <Skeleton key={k} height={70} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={
            <EmptyState
              title={tCustomers("emptyShort")}
              subtitle={debouncedSearch ? tCustomers("emptyNoResults") : tCustomers("emptyAddFirst")}
            />
          }
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
            const fullName = `${item.attributes.first_name} ${item.attributes.last_name}`;

            return (
              <Link href={`/customers/${item.id}`} asChild>
                <Pressable accessibilityRole="link" className="mb-2.5 active:opacity-70">
                  <Card>
                    <View className="flex-row items-center gap-3">
                      <Avatar name={fullName} />
                      <View className="flex-1">
                        <Text className="font-serif italic text-[18px] text-ink" numberOfLines={1}>
                          {fullName}
                        </Text>
                        <Text className="font-sans text-[12px] text-ink-2" numberOfLines={1}>
                          {item.attributes.email ?? item.attributes.phone ?? "—"}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-mono text-[13px] font-medium text-ink">
                          {formatCents(item.attributes.spent_cents)}
                        </Text>
                        <Text className="font-sans text-[11px] text-ink-3">
                          {tCustomers("visitsCount", { count: item.attributes.visits_count })}
                        </Text>
                      </View>
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
