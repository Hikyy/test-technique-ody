"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api-client";
import type { SettingsData, WeekSchedule } from "./use-settings";

export interface UpdateSettingsDTO {
  name?: string;
  address?: string;
  phone?: string | null;
  contact_email?: string | null;
  opening_hours?: WeekSchedule;
  notifications_enabled?: boolean;
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation<SettingsData, Error, UpdateSettingsDTO>({
    mutationFn: (input) => apiPatch<SettingsData>("/api/settings", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
