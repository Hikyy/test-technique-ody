"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import type { OrderData } from "./use-orders";

export interface CreateOrderLineDTO {
  dish_id: string;
  qty: number;
  unit_price_cents: number;
  notes?: string | null;
}

export interface CreateOrderDTO {
  table_number: number;
  table_id?: string | null;
  reservation_id?: string | null;
  customer_id?: string | null;
  scheduled_at: string;
  lines: CreateOrderLineDTO[];
  notes?: string | null;
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation<OrderData, Error, CreateOrderDTO>({
    mutationFn: (input) => apiPost<OrderData>("/api/orders", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
    },
  });
}
