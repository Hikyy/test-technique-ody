"use client";

import { useQuery } from "@tanstack/react-query";
import { type ApiList, apiList } from "@/lib/api-client";

export interface DishAttributesData {
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  available: boolean;
  image_url: string | null;
  created_at: string;
}

export interface DishRelationshipsData {
  category: { data: { type: "categories"; id: string } };
}

export interface DishData {
  type: "dishes";
  id: string;
  attributes: DishAttributesData;
  relationships: DishRelationshipsData;
}

export type DishListResponse = ApiList<DishData>;

export interface DishesQueryParams {
  category_id?: string | undefined;
  available?: boolean | undefined;
}

function toQueryString(params: DishesQueryParams): string {
  const sp = new URLSearchParams();
  if (params.category_id) sp.set("category_id", params.category_id);
  if (params.available !== undefined) sp.set("available", String(params.available));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function buildDishesKey(params: DishesQueryParams): readonly unknown[] {
  return ["dishes", params] as const;
}

export function useDishes(params: DishesQueryParams) {
  return useQuery<DishListResponse>({
    queryKey: buildDishesKey(params),
    queryFn: () => apiList<DishData>(`/api/menu/dishes${toQueryString(params)}`),
    placeholderData: (prev) => prev,
  });
}
