import { getCookie } from "@better-auth/expo/client";
import { ApiError, buildTenantHeaders, createApiClient } from "@ody/sdk";
import * as SecureStore from "expo-secure-store";

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

const COOKIE_STORAGE_KEY = "seve_cookie";
export const TENANT_ORG_KEY = "seve_active_org";
export const TENANT_RESTAURANT_KEY = "seve_active_restaurant";

async function readFormattedCookie(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(COOKIE_STORAGE_KEY);

    if (!stored) return null;

    const formatted = getCookie(stored);

    return formatted && formatted.length > 0 ? formatted : null;
  } catch {
    return null;
  }
}

let cachedTenant: { organizationId: string | null; restaurantId: string | null } = {
  organizationId: null,
  restaurantId: null,
};

export function setActiveTenantCache(state: { organizationId: string | null; restaurantId: string | null }): void {
  cachedTenant = state;
}

export const apiClient = createApiClient({
  baseUrl: apiBaseUrl,
  async getAuthHeaders(): Promise<Record<string, string>> {
    const cookie = await readFormattedCookie();

    return cookie ? { Cookie: cookie } : {};
  },
  getTenantHeaders: () => buildTenantHeaders(cachedTenant),
});

export const { apiFetch, apiList, apiSingleEnvelope, apiGet, apiPost, apiPatch, apiDelete, apiUpload } = apiClient;

export type { ApiList, ApiSingle, JsonApiCollection, JsonApiLinks, JsonApiMeta, JsonApiResource } from "@ody/sdk";
export { ApiError };
