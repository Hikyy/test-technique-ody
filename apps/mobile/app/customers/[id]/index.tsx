import { useCustomer, useDeleteCustomer } from "@ody/sdk";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Toast from "react-native-toast-message";
import { formatCents } from "../../../src/lib/format";
import { useTranslations } from "../../../src/lib/i18n";
import { Avatar } from "../../../src/ui/Avatar";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Skeleton } from "../../../src/ui/Skeleton";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tCustomers = useTranslations("customers");
  const tCommon = useTranslations("common");
  const customer = useCustomer(id);
  const remove = useDeleteCustomer();

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(tCustomers("confirmDelete"), "", [
      { text: tCommon("cancel"), style: "cancel" },
      {
        text: tCommon("delete"),
        style: "destructive",
        onPress: () => {
          remove.mutate(
            { id },
            {
              onSuccess: () => {
                Toast.show({ type: "success", text1: tCustomers("deleted") });
                router.back();
              },
              onError: (err) => Toast.show({ type: "error", text1: tCommon("failure"), text2: err.message }),
            },
          );
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-2 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tCommon("back")}
          onPress={() => router.back()}
          className="flex-row items-center gap-1.5"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="m15 6-6 6 6 6"
              stroke="#15140f"
              strokeOpacity={0.62}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text className="font-sans text-[13px] text-ink-2">{tCustomers("title")}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tCommon("edit")}
          onPress={() => id && router.push(`/customers/${id}/edit`)}
          className="px-3 h-8 rounded-card bg-accent-soft items-center justify-center"
        >
          <Text className="font-sans text-[12px] text-accent">{tCommon("edit")}</Text>
        </Pressable>
      </View>

      {customer.isLoading || !customer.data ? (
        <View className="px-5 mt-4 gap-3">
          <Skeleton height={120} />
          <Skeleton height={80} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
            paddingTop: 14,
          }}
        >
          <View className="flex-row items-center gap-4">
            <Avatar name={`${customer.data.attributes.first_name} ${customer.data.attributes.last_name}`} size={56} />
            <View className="flex-1">
              <Text className="font-serif italic text-[26px] leading-[28px] text-ink">
                {customer.data.attributes.first_name} {customer.data.attributes.last_name}
              </Text>
              <Text className="mt-1 font-sans text-[12px] text-ink-2">
                {customer.data.attributes.email ?? customer.data.attributes.phone ?? "—"}
              </Text>
            </View>
          </View>

          <Card className="mt-5">
            <View className="flex-row justify-between">
              <View>
                <Text className="font-sans text-[10.5px] uppercase tracking-wider text-ink-3">
                  {tCustomers("visits")}
                </Text>
                <Text className="mt-1 font-serif text-[19px] text-ink">{customer.data.attributes.visits_count}</Text>
              </View>
              <View>
                <Text className="font-sans text-[10.5px] uppercase tracking-wider text-ink-3">
                  {tCustomers("spent")}
                </Text>
                <Text className="mt-1 font-serif text-[19px] text-ink">
                  {formatCents(customer.data.attributes.spent_cents)}
                </Text>
              </View>
              <View>
                <Text className="font-sans text-[10.5px] uppercase tracking-wider text-ink-3">
                  {tCustomers("averageBasket")}
                </Text>
                <Text className="mt-1 font-serif text-[19px] text-ink">
                  {customer.data.attributes.visits_count > 0
                    ? formatCents(
                        Math.round(customer.data.attributes.spent_cents / customer.data.attributes.visits_count),
                      )
                    : "—"}
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      )}

      <View
        style={{ paddingBottom: insets.bottom + 10 }}
        className="absolute bottom-0 left-0 right-0 border-t border-line bg-bg px-5 pt-2.5"
      >
        <Button variant="ghost" loading={remove.isPending} onPress={handleDelete}>
          {tCommon("delete")}
        </Button>
      </View>
    </SafeAreaView>
  );
}
