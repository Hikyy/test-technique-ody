import {
  findCustomer,
  type OrderIncludedResource,
  resolveOrderLines,
  useCancelOrder,
  useChangeOrderStatus,
  useOrder,
} from "@ody/sdk";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Toast from "react-native-toast-message";
import { formatCents, formatTime } from "../../src/lib/format";
import { useTranslations } from "../../src/lib/i18n";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { Skeleton } from "../../src/ui/Skeleton";
import { type StatusKey, StatusPill } from "../../src/ui/StatusPill";

const CANCELLABLE: ReadonlySet<StatusKey> = new Set(["pending", "cooking", "sent"]);

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");
  const order = useOrder<OrderIncludedResource>(id);

  const NEXT: Record<StatusKey, { label: string; next: StatusKey } | null> = {
    pending: { label: tOrders("actions.startCooking"), next: "cooking" },
    cooking: { label: tOrders("actions.markSent"), next: "sent" },
    sent: { label: tOrders("actions.markServed"), next: "served" },
    served: null,
    cancelled: null,
  };

  const status = order.data?.data.attributes.status as StatusKey | undefined;
  const transition = status ? NEXT[status] : null;
  const canCancel = status ? CANCELLABLE.has(status) : false;

  const changeStatus = useChangeOrderStatus();
  const cancel = useCancelOrder();

  const handleAdvance = (next: StatusKey) => {
    if (!id) return;

    changeStatus.mutate(
      { id, status: next },
      {
        onSuccess: () => Toast.show({ type: "success", text1: tOrders("detail.statusUpdated") }),
        onError: (err) => Toast.show({ type: "error", text1: tCommon("failure"), text2: err.message }),
      },
    );
  };

  const handleCancel = () => {
    if (!id) return;

    Alert.alert(tOrders("detail.confirmCancelTitle"), tOrders("detail.confirmCancelBody"), [
      { text: tOrders("detail.confirmCancelNo"), style: "cancel" },
      {
        text: tOrders("detail.confirmCancelYes"),
        style: "destructive",
        onPress: () => {
          cancel.mutate(
            { id },
            {
              onSuccess: () => {
                Toast.show({ type: "success", text1: tOrders("cancelled") });
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
      <View className="px-5 pt-2 pb-1 flex-row items-center justify-between">
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
          <Text className="font-sans text-[13px] text-ink-2">{tOrders("title")}</Text>
        </Pressable>
      </View>

      {order.isLoading || !order.data ? (
        <View className="px-5 mt-4 gap-3">
          <Skeleton height={120} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </View>
      ) : (
        <RenderOrder
          envelope={order.data}
          status={status}
          transition={transition}
          canCancel={canCancel}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
          isAdvancing={changeStatus.isPending}
          isCancelling={cancel.isPending}
          insetsBottom={insets.bottom}
        />
      )}
    </SafeAreaView>
  );
}

interface RenderOrderProps {
  envelope: {
    data: NonNullable<ReturnType<typeof useOrder<OrderIncludedResource>>["data"]>["data"];
    included: OrderIncludedResource[];
  };
  status: StatusKey | undefined;
  transition: { label: string; next: StatusKey } | null;
  canCancel: boolean;
  onAdvance: (next: StatusKey) => void;
  onCancel: () => void;
  isAdvancing: boolean;
  isCancelling: boolean;
  insetsBottom: number;
}

function RenderOrder({
  envelope,
  status,
  transition,
  canCancel,
  onAdvance,
  onCancel,
  isAdvancing,
  isCancelling,
  insetsBottom,
}: RenderOrderProps) {
  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");
  const order = envelope.data;
  const included = envelope.included;
  const lines = resolveOrderLines(order.relationships.lines.data, included);
  const covers = lines.reduce((s, l) => s + l.qty, 0);
  const customerRef = order.relationships.customer.data;
  const customer = customerRef ? findCustomer(included, customerRef.id) : undefined;

  return (
    <>
      <View className="px-5 pt-3">
        <Card>
          <View className="flex-row items-baseline justify-between">
            <Text className="font-mono text-[12px] text-accent">T.{order.attributes.table_number}</Text>
            {status ? <StatusPill status={status} /> : null}
          </View>
          <Text className="mt-2 font-serif italic text-[26px] leading-[30px] text-ink">
            {tOrders("detail.titleLine", { table: order.attributes.table_number })}
          </Text>
          <Text className="mt-2 font-sans text-[12px] text-ink-2">
            {tOrders("detail.sendAt", { time: formatTime(order.attributes.scheduled_at), covers })}
          </Text>
          {customer ? (
            <Text className="mt-1 font-sans text-[12px] text-ink-2">
              {tOrders("detail.customerLabel")} : {customer.attributes.last_name} {customer.attributes.first_name}
              {customer.attributes.phone ? ` · ${customer.attributes.phone}` : ""}
            </Text>
          ) : null}
        </Card>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: insetsBottom + 100 }}>
        <Text className="font-sans text-[12px] uppercase tracking-wider text-ink-3 mb-1">
          {tOrders("detail.detailHeading")}
        </Text>
        {lines.map((l, i) => (
          <View
            key={l.id}
            className={`flex-row items-baseline gap-2.5 py-2.5 ${i === 0 ? "" : "border-t border-line"}`}
          >
            <Text className="font-mono text-[12px] text-ink-3 w-7">{l.qty}×</Text>
            <View className="flex-1">
              <Text className="font-sans text-[13.5px] text-ink">{l.dishName}</Text>
            </View>
            <Text className="font-mono text-[13px] text-ink-2">{formatCents(l.lineTotalCents)}</Text>
          </View>
        ))}

        {order.attributes.notes ? (
          <Text className="mt-3 font-serif italic text-[13px] text-ink-2">« {order.attributes.notes} »</Text>
        ) : null}

        <View className="mt-3 flex-row items-baseline justify-between border-t border-line-mid pt-3">
          <Text className="font-sans text-[14px] font-medium text-ink">{tOrders("total")}</Text>
          <Text className="font-mono text-[18px] font-medium text-ink">
            {formatCents(order.attributes.total_cents)}
          </Text>
        </View>
      </ScrollView>

      <View
        style={{ paddingBottom: insetsBottom + 10 }}
        className="absolute bottom-0 left-0 right-0 flex-row gap-2 border-t border-line bg-bg px-5 pt-2.5"
      >
        {canCancel ? (
          <View className="flex-1">
            <Button variant="ghost" loading={isCancelling} onPress={onCancel}>
              {tCommon("cancel")}
            </Button>
          </View>
        ) : null}
        {transition ? (
          <View className="flex-[1.4]">
            <Button variant="ink" loading={isAdvancing} onPress={() => onAdvance(transition.next)}>
              {transition.label}
            </Button>
          </View>
        ) : null}
      </View>
    </>
  );
}
