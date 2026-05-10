"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api-client";
import type { DishData } from "./use-dishes";

export interface UpdateDishDTO {
  category_id?: string;
  name?: string;
  description?: string | null;
  price_cents?: number;
  available?: boolean;
  image_url?: string | null;
}

export interface UpdateDishVariables {
  id: string;
  patch: UpdateDishDTO;
}

export function useUpdateDish() {
  const qc = useQueryClient();
  return useMutation<DishData, Error, UpdateDishVariables>({
    mutationFn: ({ id, patch }) => apiPatch<DishData>(`/api/menu/dishes/${id}`, patch),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["dishes"] });
      void qc.invalidateQueries({ queryKey: ["dish", vars.id] });
    },
  });
}
