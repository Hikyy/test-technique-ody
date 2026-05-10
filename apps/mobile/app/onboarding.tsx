import { useCompleteOnboarding, useOnboardingStatus, useSeedRestaurant } from "@ody/sdk";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { signOut } from "../src/lib/auth-client";
import { useTranslations } from "../src/lib/i18n";
import { Button } from "../src/ui/Button";

export default function MobileOnboardingScreen() {
  const router = useRouter();
  const tOnboarding = useTranslations("onboarding");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");

  const status = useOnboardingStatus();
  const seed = useSeedRestaurant();
  const complete = useCompleteOnboarding();

  useEffect(() => {
    if (status.data?.attributes.onboarded_at) router.replace("/(tabs)");
  }, [status.data, router]);

  const autoSetup = async () => {
    try {
      await seed.mutateAsync(["menu", "customers", "orders"]);
      await complete.mutateAsync();
      router.replace("/(tabs)");
    } catch (err) {
      Toast.show({ type: "error", text1: (err as Error).message ?? tErrors("generic") });
    }
  };

  const skip = async () => {
    try {
      await complete.mutateAsync();
      router.replace("/(tabs)");
    } catch (err) {
      Toast.show({ type: "error", text1: (err as Error).message ?? tErrors("generic") });
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch {}
    router.replace("/(auth)/login");
  };

  const pending = seed.isPending || complete.isPending;

  if (status.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-1 justify-center gap-7 px-6">
        <View>
          <Text className="font-sans text-[11px] uppercase tracking-wider text-ink-3">
            {tOnboarding("welcome.eyebrow")}
          </Text>
          <Text className="mt-2 font-serif text-[40px] leading-[44px] italic text-ink">
            {tOnboarding("welcome.title")}
          </Text>
          <Text className="mt-3 font-sans text-[14px] text-ink-2">{tOnboarding("mobile.subtitle")}</Text>
        </View>

        <View className="gap-3">
          <Button variant="ink" onPress={autoSetup} loading={pending}>
            {tOnboarding("mobile.autoSetup")}
          </Button>
          <Button variant="ghost" onPress={skip} loading={pending}>
            {tOnboarding("mobile.skip")}
          </Button>
        </View>

        <Pressable accessibilityRole="link" onPress={logout} className="pt-2">
          <Text className="text-center font-sans text-[12px] text-ink-3">{tAuth("signOut")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
