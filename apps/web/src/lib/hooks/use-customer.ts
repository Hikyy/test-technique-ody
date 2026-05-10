"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { CustomerData } from "./use-customers";

export function buildCustomerKey(id: string | null): readonly unknown[] {
  return ["customer", id] as const;
}

export function useCustomer(id: string | null) {
  return useQuery<CustomerData>({
    queryKey: buildCustomerKey(id),
    queryFn: () => apiGet<CustomerData>(`/api/customers/${id}`),
    enabled: Boolean(id),
  });
}
