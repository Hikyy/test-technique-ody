"use client";

import { buildTenantHeaders, createApiClient } from "@ody/sdk";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const COOKIE_ORG = "seve_active_org";
const COOKIE_RESTAURANT = "seve_active_restaurant";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export const sdkClient = createApiClient({
  baseUrl,
  credentials: "include",
  getTenantHeaders: () =>
    buildTenantHeaders({
      organizationId: readCookie(COOKIE_ORG),
      restaurantId: readCookie(COOKIE_RESTAURANT),
    }),
});

export const tenantCookieNames = { org: COOKIE_ORG, restaurant: COOKIE_RESTAURANT };
