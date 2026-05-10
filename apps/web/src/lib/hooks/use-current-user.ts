"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { CurrentUserData } from "@/lib/api-types";

type UserResource = {
  type: "users";
  id: string;
  attributes: CurrentUserData;
  relationships: Record<string, unknown>;
};

export const currentUserQueryKey = ["me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: async (): Promise<CurrentUserData> => {
      const resource = await apiGet<UserResource>("/api/auth/me");
      return resource.attributes;
    },
    staleTime: 60_000,
  });
}
