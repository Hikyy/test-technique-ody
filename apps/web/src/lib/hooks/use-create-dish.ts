"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import type { DishData } from "./use-dishes";

export interface CreateDishDTO {
  category_id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  available?: boolean;
  image_url?: string | null;
}

export function useCreateDish() {
  const qc = useQueryClient();
  return useMutation<DishData, Error, CreateDishDTO>({
    mutationFn: (input) => apiPost<DishData>("/api/menu/dishes", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
}
