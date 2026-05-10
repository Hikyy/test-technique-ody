"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { DashboardOverviewData } from "@/lib/api-types";

type DashboardResource = {
  type: "dashboard-overview";
  id: string;
  attributes: DashboardOverviewData;
  relationships: Record<string, unknown>;
};

export const dashboardOverviewQueryKey = ["dashboard", "overview"] as const;

export function useDashboardOverviewData() {
  return useQuery({
    queryKey: dashboardOverviewQueryKey,
    queryFn: async (): Promise<DashboardOverviewData> => {
      const resource = await apiGet<DashboardResource>("/api/dashboard/overview");
      return resource.attributes;
    },
    staleTime: 30_000,
  });
}
