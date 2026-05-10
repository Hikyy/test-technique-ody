import { Text, View } from "react-native";
import { useTranslations } from "../lib/i18n";

export type StatusKey = "pending" | "cooking" | "sent" | "served" | "cancelled";

const COLORS: Record<StatusKey, { bg: string; fg: string }> = {
  pending: { bg: "#ecebe7", fg: "#5c5a55" },
  cooking: { bg: "#fdf0e3", fg: "#9c4d1f" },
  sent: { bg: "#e9ebe2", fg: "#5b6e4f" },
  served: { bg: "rgba(63,107,58,0.14)", fg: "#3f6b3a" },
  cancelled: { bg: "rgba(161,74,58,0.12)", fg: "#a14a3a" },
};

type Props = { status: StatusKey };

export function StatusPill({ status }: Props) {
  const tOrders = useTranslations("orders");
  const c = COLORS[status];

  return (
    <View style={{ backgroundColor: c.bg }} className="flex-row items-center gap-1.5 rounded-full px-2 py-0.5">
      <View style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: c.fg }} />
      <Text style={{ color: c.fg }} className="font-sans text-[11px] font-medium">
        {tOrders(`statuses.${status}`)}
      </Text>
    </View>
  );
}
