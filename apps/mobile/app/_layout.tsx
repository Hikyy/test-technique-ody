import "../global.css";
import { ApiClientProvider } from "@ody/sdk";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { apiClient } from "../src/lib/api-client";
import { queryClient } from "../src/lib/query-client";
import { MobileTenantProvider } from "../src/lib/tenant-provider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#fbfaf6" }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ApiClientProvider client={apiClient}>
            <MobileTenantProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#fbfaf6" } }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="orders/[id]" options={{ presentation: "card" }} />
                <Stack.Screen name="orders/new" options={{ presentation: "modal" }} />
                <Stack.Screen name="customers/[id]/index" />
                <Stack.Screen name="customers/[id]/edit" options={{ presentation: "modal" }} />
                <Stack.Screen name="customers/new" options={{ presentation: "modal" }} />
                <Stack.Screen name="menu/new" options={{ presentation: "modal" }} />
                <Stack.Screen name="menu/[id]/edit" options={{ presentation: "modal" }} />
                <Stack.Screen name="settings" />
                <Stack.Screen name="switch" options={{ presentation: "modal" }} />
              </Stack>
              <Toast />
            </MobileTenantProvider>
          </ApiClientProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
