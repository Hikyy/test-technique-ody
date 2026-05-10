import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";

export type DayHours = { open_at: string; close_at: string } | null;

export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type WeekSchedule = Record<DayKey, DayHours>;

export interface NotificationSettings {
  newOrders: boolean;
  cancellations: boolean;
  dailyReport: boolean;
}

export interface RestaurantSettingsAttributes {
  name: string;
  address: string | null;
  phone: string | null;
  contact_email?: string | null;
  currency: string;
  opening_hours: WeekSchedule;
  notifications_enabled?: boolean;
  notifications?: NotificationSettings;
  updated_at: string;
}

export interface RestaurantSettingsData {
  type: "restaurant-settings";
  id: string;
  attributes: RestaurantSettingsAttributes;
}

export type UpdateSettingsDTO = Partial<{
  name: string;
  address: string | null;
  phone: string | null;
  contact_email: string | null;
  currency: string;
  opening_hours: WeekSchedule;
  notifications_enabled: boolean;
  notifications: NotificationSettings;
}>;

export const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  const client = useApiClient();

  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => client.apiGet<RestaurantSettingsData>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<RestaurantSettingsData, Error, UpdateSettingsDTO>({
    mutationFn: (patch) => client.apiPatch<RestaurantSettingsData>("/api/settings", patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
