"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete } from "@/lib/api-client";

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => apiDelete<void>(`/api/customers/${id}`),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
      void qc.invalidateQueries({ queryKey: ["customer", vars.id] });
    },
  });
}
