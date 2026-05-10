import {
  getOrderIdFromNotification,
  type NotificationData,
  type NotificationType,
  useMarkNotificationRead,
} from "@ody/sdk";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "../lib/i18n";

interface NotificationRowProps {
  notification: NotificationData;
  onPress?: (n: NotificationData) => void;
}

const TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

const ACCENT_BG: Record<NotificationType, string> = {
  "order.created": "bg-accent",
  "order.status_changed": "bg-warn",
  "order.cancelled": "bg-neg",
  system: "bg-ink-3",
};

function formatRelative(iso: string, todayLabel: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();

  return sameDay ? `${todayLabel} · ${TIME.format(d)}` : `${DATE.format(d)} · ${TIME.format(d)}`;
}

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const markRead = useMarkNotificationRead();
  const a = notification.attributes;

  const handlePress = () => {
    if (!a.is_read) markRead.mutate({ id: notification.id });

    if (onPress) {
      onPress(notification);
      return;
    }

    const orderId = getOrderIdFromNotification(notification);
    if (orderId) router.push(`/orders/${orderId}`);
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      className={`flex-row items-start gap-3 border-b border-line px-5 py-4 active:bg-accent-soft/60 ${
        a.is_read ? "bg-bg" : "bg-accent-soft/30"
      }`}
    >
      <View className={`mt-1.5 size-[10px] shrink-0 rounded-full ${ACCENT_BG[a.type]}`} />

      <View className="flex-1 gap-1">
        <Text className="font-sans text-[13.5px] font-medium text-ink" numberOfLines={2}>
          {a.title}
        </Text>
        <Text className="font-mono text-[11px] text-ink-3">{formatRelative(a.created_at, tCommon("today"))}</Text>
      </View>

      {!a.is_read ? <View className="mt-2 size-[7px] shrink-0 rounded-full bg-accent" /> : null}
    </Pressable>
  );
}
