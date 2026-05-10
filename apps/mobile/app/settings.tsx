import {
  type UpdateSettingsDTO,
  useActiveOrganization,
  useActiveRestaurant,
  useOrganizations,
  useRestaurantsInOrg,
  useSettings,
  useUpdateSettings,
} from "@ody/sdk";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Toast from "react-native-toast-message";
import { signOut } from "../src/lib/auth-client";
import { useTranslations } from "../src/lib/i18n";
import { Button } from "../src/ui/Button";
import { FormField } from "../src/ui/FormField";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tSettings = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const tOrg = useTranslations("organization");

  const settings = useSettings();
  const orgs = useOrganizations();
  const activeOrgId = useActiveOrganization();
  const activeRestaurantId = useActiveRestaurant();
  const restaurants = useRestaurantsInOrg(activeOrgId);
  const activeOrg = orgs.data?.items.find((o) => o.id === activeOrgId);
  const activeRestaurant = restaurants.data?.items.find((r) => r.id === activeRestaurantId);
  const update = useUpdateSettings();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [newOrders, setNewOrders] = useState(true);
  const [cancellations, setCancellations] = useState(true);
  const [dailyReport, setDailyReport] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const a = settings.data?.attributes;

    if (!a) return;

    setName(a.name ?? "");
    setAddress(a.address ?? "");
    setPhone(a.phone ?? "");
    const enabled = a.notifications?.newOrders ?? a.notifications_enabled ?? true;
    setNewOrders(a.notifications?.newOrders ?? enabled);
    setCancellations(a.notifications?.cancellations ?? enabled);
    setDailyReport(a.notifications?.dailyReport ?? enabled);
    setDirty(false);
  }, [settings.data?.attributes]);

  const handleSave = () => {
    const patch: UpdateSettingsDTO = {
      name,
      address: address ? address : null,
      phone: phone ? phone : null,
      notifications: { newOrders, cancellations, dailyReport },
    };

    update.mutate(patch, {
      onSuccess: () => {
        Toast.show({ type: "success", text1: tSettings("saved") });
        setDirty(false);
      },
      onError: (err) => Toast.show({ type: "error", text1: tCommon("save"), text2: err.message }),
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {}

    router.replace("/(auth)/login");
  };

  const setField =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setDirty(true);
    };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-2 flex-row items-center">
        <Pressable accessibilityRole="button" onPress={() => router.back()} className="flex-row items-center gap-1.5">
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
          <Text className="font-sans text-[13px] text-ink-2">{tCommon("back")}</Text>
        </Pressable>
      </View>

      <View className="px-5 pt-4">
        <Text className="font-serif italic text-[36px] leading-[36px] text-accent">{tSettings("title")}</Text>
      </View>

      {settings.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: insets.bottom + 100,
              gap: 24,
            }}
          >
            <Pressable
              onPress={() => router.push("/switch")}
              className="rounded-card border border-line-mid bg-surface px-4 py-3 active:opacity-70"
              accessibilityRole="button"
            >
              <Text className="font-sans text-[12px] uppercase tracking-wider text-ink-3">{tOrg("eyebrow")}</Text>
              <Text className="font-sans text-[14px] text-ink mt-1">
                {activeOrg?.attributes.name ?? tOrg("noOrganization")}
                {activeRestaurant ? ` · ${activeRestaurant.attributes.name}` : ""}
              </Text>
              <Text className="font-sans text-[12px] text-accent mt-1">{tOrg("title")} →</Text>
            </Pressable>

            <View className="gap-3">
              <Text className="font-serif italic text-[19px] text-accent">— {tSettings("restaurant")}</Text>

              <FormField
                label={tSettings("name")}
                value={name}
                onChangeText={setField(setName)}
                autoCapitalize="words"
              />
              <FormField label={tSettings("address")} value={address} onChangeText={setField(setAddress)} multiline />
              <FormField
                label={tSettings("phone")}
                value={phone}
                onChangeText={setField(setPhone)}
                keyboardType="phone-pad"
              />
            </View>

            <View className="gap-2">
              <Text className="font-serif italic text-[19px] text-accent mb-1">— {tSettings("notifications")}</Text>
              <Text className="font-sans text-[12px] text-ink-2 mb-1">{tSettings("notificationsHint")}</Text>

              <ToggleRow label="Nouvelle commande" value={newOrders} onValueChange={setField(setNewOrders)} />
              <ToggleRow label="Annulation" value={cancellations} onValueChange={setField(setCancellations)} />
              <ToggleRow label="Rapport quotidien" value={dailyReport} onValueChange={setField(setDailyReport)} />
            </View>

            <View className="pt-4 border-t border-line">
              <Button variant="ghost" onPress={handleSignOut} accessibilityLabel={tAuth("signOut")}>
                {tAuth("signOut")}
              </Button>
            </View>
          </ScrollView>

          {dirty ? (
            <View
              style={{ paddingBottom: insets.bottom + 10 }}
              className="absolute bottom-0 left-0 right-0 border-t border-line bg-bg px-5 pt-2.5"
            >
              <Button variant="ink" loading={update.isPending} onPress={handleSave}>
                {tSettings("save")}
              </Button>
            </View>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between border-t border-line py-3">
      <Text className="font-sans text-[13.5px] text-ink">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: "#5b6e4f", false: "#dcd9d0" }}
        thumbColor="#ffffff"
      />
    </View>
  );
}
