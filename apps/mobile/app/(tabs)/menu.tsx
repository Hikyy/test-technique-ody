import { type DishData, useCategories, useDishes, useToggleDishAvailability } from "@ody/sdk";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, SectionList, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { formatCents } from "../../src/lib/format";
import { useTranslations } from "../../src/lib/i18n";
import { EmptyState } from "../../src/ui/EmptyState";
import { Skeleton } from "../../src/ui/Skeleton";

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tMenu = useTranslations("menu");
  const tCommon = useTranslations("common");
  const cats = useCategories();
  const dishes = useDishes();
  const toggle = useToggleDishAvailability();
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const handleToggle = (id: string, name: string) => {
    toggle.mutate(
      { id },
      {
        onSuccess: () => Toast.show({ type: "success", text1: tMenu("toastAvailability", { name }) }),
        onError: (err) => Toast.show({ type: "error", text1: tCommon("failure"), text2: err.message }),
      },
    );
  };

  const sections = useMemo(() => {
    const categoryList = cats.data?.items ?? [];
    const dishList = dishes.data?.items ?? [];
    const list = categoryList.map((c) => ({
      title: c.attributes.name,
      catId: c.id,
      data: dishList.filter((d) => d.relationships.category.data.id === c.id),
    }));
    if (activeCat) return list.filter((s) => s.catId === activeCat);
    return list;
  }, [cats.data, dishes.data, activeCat]);

  const isLoading = cats.isLoading || dishes.isLoading;

  const handleCreate = () => {
    if (activeCat) {
      router.push({ pathname: "/menu/new", params: { category_id: activeCat } });
    } else {
      router.push("/menu/new");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-3 pb-3 flex-row items-center justify-between">
        <Text className="font-sans text-[17px] font-medium text-ink">{tMenu("title")}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tMenu("newDish")}
          onPress={handleCreate}
          className="size-9 rounded-full bg-ink items-center justify-center"
        >
          <Text className="font-sans text-[20px] text-bg leading-[20px]">+</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        className="grow-0"
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveCat(null)}
          className={`px-3 py-1.5 rounded-full border ${activeCat === null ? "bg-ink border-ink" : "border-line-mid"}`}
        >
          <Text className={`font-sans text-[12px] ${activeCat === null ? "text-bg" : "text-ink-2"}`}>
            {tMenu("allCategoriesShort")}
          </Text>
        </Pressable>
        {(cats.data?.items ?? []).map((c) => {
          const a = activeCat === c.id;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              onPress={() => setActiveCat(c.id)}
              className={`px-3 py-1.5 rounded-full border ${a ? "bg-ink border-ink" : "border-line-mid"}`}
            >
              <Text className={`font-sans text-[12px] ${a ? "text-bg" : "text-ink-2"}`}>{c.attributes.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View className="px-5 gap-2 mt-4">
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </View>
      ) : (
        <SectionList<DishData, { title: string; catId: string }>
          sections={sections}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20, paddingTop: 14 }}
          renderSectionHeader={({ section }) => (
            <Text className="font-serif italic text-[19px] text-accent mt-4 mb-2">— {section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.attributes.name}
              onPress={() => router.push(`/menu/${item.id}/edit`)}
              onLongPress={() => handleToggle(item.id, item.attributes.name)}
              className="flex-row items-center justify-between border-t border-line py-3 active:bg-accent-soft"
            >
              <View className="flex-1 pr-3">
                <Text className={`font-sans text-[14px] ${item.attributes.available ? "text-ink" : "text-ink-3"}`}>
                  {item.attributes.name}
                </Text>
                {item.attributes.description ? (
                  <Text className="font-sans text-[11.5px] text-ink-2 mt-1" numberOfLines={1}>
                    {item.attributes.description}
                  </Text>
                ) : null}
                {!item.attributes.available ? (
                  <Text className="mt-1 font-sans text-[10.5px] uppercase tracking-wider text-warn-ink">
                    {tMenu("unavailable")}
                  </Text>
                ) : null}
              </View>
              <Text className="font-mono text-[13px] text-ink">{formatCents(item.attributes.price_cents)}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState title={tMenu("emptyShort")} />}
        />
      )}
    </SafeAreaView>
  );
}
