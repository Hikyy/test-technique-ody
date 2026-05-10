"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export type DayHours = { open_at: string; close_at: string } | null;

export interface WeekSchedule {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface SettingsAttributesData {
  name: string;
  address: string;
  phone: string | null;
  contact_email: string | null;
  opening_hours: WeekSchedule;
  notifications_enabled: boolean;
  updated_at: string;
}

export interface SettingsData {
  type: "restaurant-settings";
  id: string;
  attributes: SettingsAttributesData;
}

export const settingsQueryKey = ["settings"] as const;

export function useSettings() {
  return useQuery<SettingsData>({
    queryKey: settingsQueryKey,
    queryFn: () => apiGet<SettingsData>("/api/settings"),
  });
}
