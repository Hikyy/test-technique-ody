"use client";

import { useQuery } from "@tanstack/react-query";
import { type ApiList, apiList } from "@/lib/api-client";

export interface CustomerAttributesData {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  visits_count: number;
  spent_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerRelationshipsData {
  orders?: { data: Array<{ type: "orders"; id: string }> };
}

export interface CustomerData {
  type: "customers";
  id: string;
  attributes: CustomerAttributesData;
  relationships?: CustomerRelationshipsData;
}

export type CustomerListResponse = ApiList<CustomerData>;

export type CustomerSearchScope = "name" | "email" | "phone";

export interface CustomersQueryParams {
  search?: string | undefined;
  search_scope?: CustomerSearchScope | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

function toQueryString(params: CustomersQueryParams): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.search_scope) sp.set("search_scope", params.search_scope);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function buildCustomersKey(params: CustomersQueryParams): readonly unknown[] {
  return ["customers", params] as const;
}

export function useCustomers(params: CustomersQueryParams) {
  return useQuery<CustomerListResponse>({
    queryKey: buildCustomersKey(params),
    queryFn: () => apiList<CustomerData>(`/api/customers${toQueryString(params)}`),
    placeholderData: (prev) => prev,
  });
}
