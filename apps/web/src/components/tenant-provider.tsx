"use client";

import { TenantProvider as SdkTenantProvider, type TenantState } from "@ody/sdk";
import type { ReactNode } from "react";
import { tenantCookieNames } from "@/lib/sdk-client";

const ONE_YEAR = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string | null) {
  if (typeof document === "undefined") return;
  if (value === null) {
    document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
    return;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function WebTenantProvider({ children }: { children: ReactNode }) {
  return (
    <SdkTenantProvider
      adapter={{
        load: () => ({
          organizationId: readCookie(tenantCookieNames.org),
          restaurantId: readCookie(tenantCookieNames.restaurant),
        }),
        save: (next: TenantState) => {
          writeCookie(tenantCookieNames.org, next.organizationId);
          writeCookie(tenantCookieNames.restaurant, next.restaurantId);
        },
      }}
    >
      {children}
    </SdkTenantProvider>
  );
}
