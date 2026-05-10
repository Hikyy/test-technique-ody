import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";

export type OrgRole = "owner" | "admin" | "member";

export interface OrganizationAttributes {
  name: string;
  role: OrgRole;
  created_at: string;
  updated_at: string;
}

export interface OrganizationData {
  type: "organizations";
  id: string;
  attributes: OrganizationAttributes;
}

export interface RestaurantInOrgAttributes {
  name: string;
  created_at: string;
}

export interface RestaurantInOrgData {
  type: "restaurants";
  id: string;
  attributes: RestaurantInOrgAttributes;
  relationships: { organization: { data: { type: "organizations"; id: string } } };
}

export interface CreateOrganizationDTO {
  name: string;
}

export interface CreateRestaurantInOrgDTO {
  name: string;
}

export const organizationsKeys = {
  all: ["organizations"] as const,
  restaurants: (orgId: string) => ["organizations", orgId, "restaurants"] as const,
};

export function useOrganizations() {
  const client = useApiClient();

  return useQuery({
    queryKey: organizationsKeys.all,
    queryFn: () => client.apiList<OrganizationData>("/api/organizations"),
    staleTime: 60_000,
  });
}

export function useCreateOrganization() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<OrganizationData, Error, CreateOrganizationDTO>({
    mutationFn: (input) => client.apiPost<OrganizationData>("/api/organizations", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: organizationsKeys.all });
    },
  });
}

export function useRestaurantsInOrg(orgId: string | null | undefined) {
  const client = useApiClient();

  return useQuery({
    queryKey: orgId ? organizationsKeys.restaurants(orgId) : ["organizations", "no-org"],
    queryFn: () => client.apiList<RestaurantInOrgData>(`/api/organizations/${orgId}/restaurants`),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });
}

export function useCreateRestaurantInOrg(orgId: string) {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<RestaurantInOrgData, Error, CreateRestaurantInOrgDTO>({
    mutationFn: (input) => client.apiPost<RestaurantInOrgData>(`/api/organizations/${orgId}/restaurants`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: organizationsKeys.restaurants(orgId) });
    },
  });
}
