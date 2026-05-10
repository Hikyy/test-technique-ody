"use client";

import { useQuery } from "@tanstack/react-query";
import { type ApiList, apiList } from "@/lib/api-client";

export interface CategoryAttributesData {
  name: string;
  position: number;
}

export interface CategoryData {
  type: "categories";
  id: string;
  attributes: CategoryAttributesData;
}

export type CategoryListResponse = ApiList<CategoryData>;

export const categoriesQueryKey = ["categories"] as const;

export function useCategories() {
  return useQuery<CategoryListResponse>({
    queryKey: categoriesQueryKey,
    queryFn: () => apiList<CategoryData>("/api/menu/categories"),
    staleTime: 60_000,
  });
}
