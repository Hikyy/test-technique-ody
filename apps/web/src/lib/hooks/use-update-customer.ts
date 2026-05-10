"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api-client";
import type { CustomerData } from "./use-customers";

export interface UpdateCustomerDTO {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerVariables {
  id: string;
  patch: UpdateCustomerDTO;
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation<CustomerData, Error, UpdateCustomerVariables>({
    mutationFn: ({ id, patch }) => apiPatch<CustomerData>(`/api/customers/${id}`, patch),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
      void qc.invalidateQueries({ queryKey: ["customer", vars.id] });
    },
  });
}
