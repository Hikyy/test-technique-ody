import {
  useActiveOrganization,
  useActiveRestaurant,
  useCreateOrganization,
  useCreateRestaurantInOrg,
  useOrganizations,
  useRestaurantsInOrg,
  useSwitchOrganization,
  useSwitchRestaurant,
} from "@ody/sdk";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Toast from "react-native-toast-message";
import { useTranslations } from "../src/lib/i18n";
import { Button } from "../src/ui/Button";
import { FormField } from "../src/ui/FormField";

export default function SwitchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tOrg = useTranslations("organization");
  const tCommon = useTranslations("common");

  const orgs = useOrganizations();
  const ownsOrg = orgs.data?.items.some((o) => o.attributes.role === "owner") ?? false;
  const activeOrgId = useActiveOrganization();
  const activeRestaurantId = useActiveRestaurant();
  const activeOrgRole = orgs.data?.items.find((o) => o.id === activeOrgId)?.attributes.role;
  const canCreateRestaurant = activeOrgRole === "owner" || activeOrgRole === "admin";
  const setOrganization = useSwitchOrganization();
  const setRestaurant = useSwitchRestaurant();
  const restaurants = useRestaurantsInOrg(activeOrgId);

  const createOrg = useCreateOrganization();
  const createRestaurant = useCreateRestaurantInOrg(activeOrgId ?? "");

  const [orgName, setOrgName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [showNewRestaurant, setShowNewRestaurant] = useState(false);

  const handlePickOrg = (id: string) => {
    setOrganization(id);
    Toast.show({ type: "success", text1: tOrg("switched") });
  };

  const handlePickRestaurant = (id: string) => {
    setRestaurant(id);
    Toast.show({ type: "success", text1: tOrg("switched") });
    router.replace("/(tabs)");
  };

  const handleCreateOrg = () => {
    if (!orgName.trim()) return;
    createOrg.mutate(
      { name: orgName.trim() },
      {
        onSuccess: (org) => {
          setOrganization(org.id);
          setRestaurant(null);
          Toast.show({ type: "success", text1: tOrg("organizationCreated") });
          setOrgName("");
          setShowNewOrg(false);
        },
        onError: (err) => Toast.show({ type: "error", text1: err.message }),
      },
    );
  };

  const handleCreateRestaurant = () => {
    if (!restaurantName.trim() || !activeOrgId) return;
    createRestaurant.mutate(
      { name: restaurantName.trim() },
      {
        onSuccess: (r) => {
          setRestaurant(r.id);
          Toast.show({ type: "success", text1: tOrg("restaurantCreated") });
          setRestaurantName("");
          setShowNewRestaurant(false);
          router.replace("/(tabs)");
        },
        onError: (err) => Toast.show({ type: "error", text1: err.message }),
      },
    );
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
        <Text className="font-sans text-[12px] uppercase tracking-wider text-ink-3">{tOrg("eyebrow")}</Text>
        <Text className="font-serif italic text-[36px] leading-[36px] text-accent mt-1">{tOrg("title")}</Text>
      </View>

      {orgs.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 40,
            gap: 28,
          }}
        >
          <Section title={tOrg("activeOrganization")}>
            {orgs.data?.items.length ? (
              orgs.data.items.map((o) => (
                <PickerRow
                  key={o.id}
                  label={o.attributes.name}
                  hint={o.attributes.role}
                  selected={o.id === activeOrgId}
                  onPress={() => handlePickOrg(o.id)}
                />
              ))
            ) : (
              <EmptyText label={tOrg("noOrganization")} />
            )}

            {showNewOrg ? (
              <View className="gap-3 pt-3">
                <FormField
                  label={tOrg("nameLabel")}
                  value={orgName}
                  onChangeText={setOrgName}
                  autoCapitalize="words"
                  autoFocus
                />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button variant="ghost" onPress={() => setShowNewOrg(false)}>
                      {tCommon("cancel")}
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button
                      variant="ink"
                      loading={createOrg.isPending}
                      disabled={!orgName.trim()}
                      onPress={handleCreateOrg}
                    >
                      {createOrg.isPending ? tOrg("creating") : tOrg("create")}
                    </Button>
                  </View>
                </View>
              </View>
            ) : ownsOrg ? null : (
              <Pressable
                onPress={() => setShowNewOrg(true)}
                className="flex-row items-center gap-2 py-3 active:opacity-60"
              >
                <Text className="text-[14px] text-accent">+ {tOrg("newOrganization")}</Text>
              </Pressable>
            )}
          </Section>

          {activeOrgId ? (
            <Section title={tOrg("activeRestaurant")}>
              {restaurants.isLoading ? (
                <ActivityIndicator />
              ) : restaurants.data?.items.length ? (
                restaurants.data.items.map((r) => (
                  <PickerRow
                    key={r.id}
                    label={r.attributes.name}
                    selected={r.id === activeRestaurantId}
                    onPress={() => handlePickRestaurant(r.id)}
                  />
                ))
              ) : (
                <EmptyText label={tOrg("noRestaurant")} />
              )}

              {showNewRestaurant ? (
                <View className="gap-3 pt-3">
                  <FormField
                    label={tOrg("nameLabel")}
                    value={restaurantName}
                    onChangeText={setRestaurantName}
                    autoCapitalize="words"
                    autoFocus
                  />
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button variant="ghost" onPress={() => setShowNewRestaurant(false)}>
                        {tCommon("cancel")}
                      </Button>
                    </View>
                    <View className="flex-1">
                      <Button
                        variant="ink"
                        loading={createRestaurant.isPending}
                        disabled={!restaurantName.trim()}
                        onPress={handleCreateRestaurant}
                      >
                        {createRestaurant.isPending ? tOrg("creating") : tOrg("create")}
                      </Button>
                    </View>
                  </View>
                </View>
              ) : canCreateRestaurant ? (
                <Pressable
                  onPress={() => setShowNewRestaurant(true)}
                  className="flex-row items-center gap-2 py-3 active:opacity-60"
                >
                  <Text className="text-[14px] text-accent">+ {tOrg("newRestaurant")}</Text>
                </Pressable>
              ) : null}
            </Section>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-serif italic text-[19px] text-accent mb-1">— {title}</Text>
      {children}
    </View>
  );
}

function PickerRow({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between border-t border-line py-3 active:opacity-60 ${selected ? "" : ""}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View className="flex-1 pr-3">
        <Text className="font-sans text-[14px] text-ink">{label}</Text>
        {hint ? <Text className="font-sans text-[12px] text-ink-3 mt-0.5">{hint}</Text> : null}
      </View>
      {selected ? (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="m5 12 5 5L20 7" stroke="#5b6e4f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}
    </Pressable>
  );
}

function EmptyText({ label }: { label: string }) {
  return <Text className="font-sans text-[13px] text-ink-3 py-2">{label}</Text>;
}
