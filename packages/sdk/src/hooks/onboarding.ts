import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";

export type SeedScope = "menu" | "customers" | "orders";

export interface OnboardingStatusData {
  type: "onboarding-status";
  id: string;
  attributes: {
    restaurant_name: string;
    onboarded_at: string | null;
    counts: {
      categories: number;
      dishes: number;
      customers: number;
      orders: number;
    };
  };
}

export interface SeedRestaurantResponseData {
  type: "onboarding-seed";
  id: string;
  attributes: {
    inserted: {
      categories: number;
      dishes: number;
      customers: number;
      orders: number;
      notifications: number;
    };
  };
}

export interface CompleteOnboardingResponseData {
  type: "onboarding-completion";
  id: string;
  attributes: { onboarded_at: string };
}

export const onboardingKeys = {
  status: ["onboarding", "status"] as const,
};

export function useOnboardingStatus() {
  const client = useApiClient();

  return useQuery({
    queryKey: onboardingKeys.status,
    queryFn: () => client.apiGet<OnboardingStatusData>("/api/onboarding/status"),
    staleTime: 30_000,
  });
}

export function useSeedRestaurant() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (scopes: SeedScope[]) => client.apiPost<SeedRestaurantResponseData>("/api/onboarding/seed", { scopes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: onboardingKeys.status });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCompleteOnboarding() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => client.apiPost<CompleteOnboardingResponseData>("/api/onboarding/complete", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: onboardingKeys.status });
    },
  });
}
