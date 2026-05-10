"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import type { CustomerData } from "./use-customers";

export interface CreateCustomerDTO {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation<CustomerData, Error, CreateCustomerDTO>({
    mutationFn: (input) => apiPost<CustomerData>("/api/customers", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
