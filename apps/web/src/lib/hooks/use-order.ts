"use client";

import { useQuery } from "@tanstack/react-query";
import { type ApiSingle, apiSingleEnvelope } from "@/lib/api-client";
import type { OrderData, OrderIncludedResource } from "./use-orders";

export type OrderEnvelope = ApiSingle<OrderData, OrderIncludedResource>;

export function buildOrderKey(id: string | null): readonly unknown[] {
  return ["order", id] as const;
}

export function useOrder(id: string | null) {
  return useQuery<OrderEnvelope>({
    queryKey: buildOrderKey(id),
    queryFn: () => apiSingleEnvelope<OrderData, OrderIncludedResource>(`/api/orders/${id}`),
    enabled: Boolean(id),
  });
}
