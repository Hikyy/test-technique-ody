import { TenantProvider as SdkTenantProvider, type TenantState } from "@ody/sdk";
import * as SecureStore from "expo-secure-store";
import { type ReactNode, useEffect, useState } from "react";
import { setActiveTenantCache, TENANT_ORG_KEY, TENANT_RESTAURANT_KEY } from "./api-client";

export function MobileTenantProvider({ children }: { children: ReactNode }) {
  const [initial, setInitial] = useState<TenantState | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [organizationId, restaurantId] = await Promise.all([
        SecureStore.getItemAsync(TENANT_ORG_KEY),
        SecureStore.getItemAsync(TENANT_RESTAURANT_KEY),
      ]);

      if (cancelled) return;

      const state: TenantState = {
        organizationId: organizationId ?? null,
        restaurantId: restaurantId ?? null,
      };

      setActiveTenantCache(state);
      setInitial(state);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!initial) return null;

  return (
    <SdkTenantProvider
      initial={initial}
      adapter={{
        load: () => initial,
        save: (next) => {
          setActiveTenantCache(next);
          if (next.organizationId) {
            void SecureStore.setItemAsync(TENANT_ORG_KEY, next.organizationId);
          } else {
            void SecureStore.deleteItemAsync(TENANT_ORG_KEY);
          }
          if (next.restaurantId) {
            void SecureStore.setItemAsync(TENANT_RESTAURANT_KEY, next.restaurantId);
          } else {
            void SecureStore.deleteItemAsync(TENANT_RESTAURANT_KEY);
          }
        },
      }}
    >
      {children}
    </SdkTenantProvider>
  );
}
