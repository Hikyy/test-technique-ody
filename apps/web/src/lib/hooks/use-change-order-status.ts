"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api-client";
import type { OrderData, OrderStatus } from "./use-orders";

export interface ChangeOrderStatusVariables {
  id: string;
  status: OrderStatus;
}

export function useChangeOrderStatus() {
  const qc = useQueryClient();
  return useMutation<OrderData, Error, ChangeOrderStatusVariables>({
    mutationFn: ({ id, status }) => apiPatch<OrderData>(`/api/orders/${id}/status`, { status }),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["order", vars.id] });
      void qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
    },
  });
}
