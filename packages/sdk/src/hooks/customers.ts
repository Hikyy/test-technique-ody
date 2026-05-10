import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";

export interface CustomerAttributes {
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

export interface CustomerData {
  type: "customers";
  id: string;
  attributes: CustomerAttributes;
}

export interface CreateCustomerDTO {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export type UpdateCustomerDTO = Partial<CreateCustomerDTO>;

export type CustomerSearchScope = "name" | "email" | "phone";

export const customerSearchScopes: readonly { key: CustomerSearchScope; label: string }[] = [
  { key: "name", label: "Nom" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Téléphone" },
] as const;

export interface CustomersQuery {
  search?: string;
  search_scope?: CustomerSearchScope;
  page?: number;
  pageSize?: number;
}

export const customersKeys = {
  all: ["customers"] as const,
  list: (q: CustomersQuery) => ["customers", q] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
};

export function useCustomers(query: CustomersQuery = {}) {
  const client = useApiClient();

  return useQuery({
    queryKey: customersKeys.list(query),
    queryFn: () =>
      client.apiList<CustomerData>("/api/customers", {
        query: {
          search: query.search,
          search_scope: query.search_scope,
          page: query.page,
          pageSize: query.pageSize,
        },
      }),
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(id: string | undefined) {
  const client = useApiClient();

  return useQuery({
    enabled: Boolean(id),
    queryKey: id ? customersKeys.detail(id) : ["customers", "detail", "_none"],
    queryFn: () => client.apiGet<CustomerData>(`/api/customers/${id}`),
  });
}

export function useCreateCustomer() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<CustomerData, Error, CreateCustomerDTO>({
    mutationFn: (input) => client.apiPost<CustomerData>("/api/customers", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: customersKeys.all });
    },
  });
}

export function useUpdateCustomer() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<CustomerData, Error, { id: string; patch: UpdateCustomerDTO }>({
    mutationFn: ({ id, patch }) => client.apiPatch<CustomerData>(`/api/customers/${id}`, patch),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: customersKeys.all });
      void qc.invalidateQueries({ queryKey: customersKeys.detail(id) });
    },
  });
}

export function useDeleteCustomer() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => client.apiDelete<void>(`/api/customers/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: customersKeys.all });
    },
  });
}
