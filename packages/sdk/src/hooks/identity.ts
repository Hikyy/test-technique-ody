import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../context";

export interface CurrentUserAttributes {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface CurrentUserData {
  type: "users";
  id: string;
  attributes: CurrentUserAttributes;
  relationships: Record<string, unknown>;
}

export const identityKeys = {
  me: ["identity", "me"] as const,
};

export function useCurrentUser() {
  const client = useApiClient();

  return useQuery({
    queryKey: identityKeys.me,
    queryFn: () => client.apiGet<CurrentUserData>("/api/auth/me"),
    staleTime: 60_000,
  });
}
