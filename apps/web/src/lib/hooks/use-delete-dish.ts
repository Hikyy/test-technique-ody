"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete } from "@/lib/api-client";

export function useDeleteDish() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => apiDelete<void>(`/api/menu/dishes/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
}
