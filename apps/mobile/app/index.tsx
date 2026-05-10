import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { View } from "react-native";

const COOKIE_KEY = "seve_cookie";

export default function IndexGate() {
  const [state, setState] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    let mounted = true;

    SecureStore.getItemAsync(COOKIE_KEY).then((stored) => {
      if (!mounted) return;
      setState(stored && stored !== "{}" ? "in" : "out");
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (state === "loading") return <View className="flex-1 bg-bg" />;
  if (state === "in") return <Redirect href="/(tabs)" />;

  return <Redirect href="/(auth)/login" />;
}
