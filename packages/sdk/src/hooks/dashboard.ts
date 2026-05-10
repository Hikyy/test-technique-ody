import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../context";

export interface SparkPoint {
  date: string;
  value: number;
}

export interface KpiCardData {
  value: number;
  delta: number;
  spark: SparkPoint[];
}

export interface DashboardOverviewAttributes {
  couverts_du_jour: KpiCardData;
  ca_estime: KpiCardData;
  panier_moyen: KpiCardData;
  taux_annulation: KpiCardData;
  top_plats: { id: string; name: string; qty: number }[];
}

export interface DashboardOverviewData {
  type: "dashboard-overview";
  id: string;
  attributes: DashboardOverviewAttributes;
}

export const dashboardKeys = {
  overview: ["dashboard", "overview"] as const,
};

export function useDashboardOverview() {
  const client = useApiClient();

  return useQuery({
    queryKey: dashboardKeys.overview,
    queryFn: () => client.apiGet<DashboardOverviewData>("/api/dashboard/overview"),
    staleTime: 30_000,
  });
}
