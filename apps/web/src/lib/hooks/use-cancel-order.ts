"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import type { OrderData } from "./use-orders";

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation<OrderData, Error, { id: string }>({
    mutationFn: ({ id }) => apiPost<OrderData>(`/api/orders/${id}/cancel`, {}),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["order", vars.id] });
      void qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
    },
  });
}
