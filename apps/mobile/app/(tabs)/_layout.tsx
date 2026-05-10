import { useOnboardingStatus } from "@ody/sdk";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useTranslations } from "../../src/lib/i18n";
import { TabIcon, type TabKey } from "../../src/ui/TabIcon";

export default function TabsLayout() {
  const tNav = useTranslations("nav");
  const status = useOnboardingStatus();

  const TITLES: Record<TabKey, string> = {
    home: tNav("home"),
    orders: tNav("orders"),
    customers: tNav("customers"),
    menu: tNav("menu"),
    notifications: tNav("activity"),
  };

  if (status.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator />
      </View>
    );
  }

  if (status.data && !status.data.attributes.onboarded_at) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#15140f",
        tabBarInactiveTintColor: "rgba(21,20,15,0.42)",
        tabBarStyle: {
          backgroundColor: "#fbfaf6",
          borderTopColor: "rgba(20,20,18,0.06)",
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Geist", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: TITLES.home, tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: TITLES.orders, tabBarIcon: ({ color }) => <TabIcon name="orders" color={color} /> }}
      />
      <Tabs.Screen
        name="customers"
        options={{ title: TITLES.customers, tabBarIcon: ({ color }) => <TabIcon name="customers" color={color} /> }}
      />
      <Tabs.Screen
        name="menu"
        options={{ title: TITLES.menu, tabBarIcon: ({ color }) => <TabIcon name="menu" color={color} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: TITLES.notifications,
          tabBarIcon: ({ color }) => <TabIcon name="notifications" color={color} />,
        }}
      />
    </Tabs>
  );
}
