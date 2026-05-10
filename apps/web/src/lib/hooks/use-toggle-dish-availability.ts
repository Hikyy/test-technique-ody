"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import type { DishData } from "./use-dishes";

export function useToggleDishAvailability() {
  const qc = useQueryClient();
  return useMutation<DishData, Error, { id: string }>({
    mutationFn: ({ id }) => apiPost<DishData>(`/api/menu/dishes/${id}/toggle-availability`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
}
