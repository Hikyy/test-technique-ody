import { useMarkAllNotificationsRead, useNotifications } from "@ody/sdk";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { NotificationRow } from "../../src/components/notification-row";
import { useTranslations } from "../../src/lib/i18n";

type Filter = "all" | "unread";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const tNotif = useTranslations("notifications");
  const [filter, setFilter] = useState<Filter>("all");
  const list = useNotifications({ status: filter, pageSize: 50 });
  const markAll = useMarkAllNotificationsRead();
  const items = list.data?.items ?? [];
  const unread = (list.data?.meta as { unread?: number } | undefined)?.unread ?? 0;

  const handleMarkAllRead = () => {
    markAll.mutate(undefined, {
      onSuccess: ({ updated }) => Toast.show({ type: "success", text1: tNotif("toastMarked", { n: updated }) }),
      onError: (err) => Toast.show({ type: "error", text1: err.message }),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-3 pb-4">
        <Text className="font-serif italic text-[36px] leading-[36px] text-accent">{tNotif("title")}</Text>

        <View className="mt-5 flex-row items-center gap-2">
          <FilterChip label={tNotif("filters.all")} active={filter === "all"} onPress={() => setFilter("all")} />
          <FilterChip
            label={unread > 0 ? tNotif("filters.unreadCount", { n: unread }) : tNotif("filters.unread")}
            active={filter === "unread"}
            onPress={() => setFilter("unread")}
          />

          {unread > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleMarkAllRead}
              disabled={markAll.isPending}
              className="ml-auto rounded-full border border-line-mid px-3 py-1.5 active:opacity-60"
            >
              <Text className="font-sans text-[12px] text-ink-2">{markAll.isPending ? "…" : tNotif("markAll")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {list.isLoading && items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-serif italic text-[22px] text-ink">
            {filter === "unread" ? tNotif("empty.allRead") : tNotif("empty.title")}
          </Text>
          <Text className="mt-2 text-center font-sans text-[13px] text-ink-2">
            {filter === "unread" ? tNotif("empty.allReadBody") : tNotif("empty.subtitle")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => <NotificationRow notification={item} />}
          refreshControl={
            <RefreshControl refreshing={list.isFetching && !list.isLoading} onRefresh={() => list.refetch()} />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 active:opacity-60 ${
        active ? "border-ink bg-ink" : "border-line bg-bg"
      }`}
    >
      <Text className={`font-sans text-[12px] ${active ? "text-bg" : "text-ink-2"}`}>{label}</Text>
    </Pressable>
  );
}
