"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { DishData } from "./use-dishes";

export function buildDishKey(id: string | null): readonly unknown[] {
  return ["dish", id] as const;
}

export function useDish(id: string | null) {
  return useQuery<DishData>({
    queryKey: buildDishKey(id),
    queryFn: () => apiGet<DishData>(`/api/menu/dishes/${id}`),
    enabled: Boolean(id),
  });
}
