import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";
import type { ApiList, ApiSingle } from "../types";

export type OrderStatus = "pending" | "cooking" | "sent" | "served" | "cancelled";

export interface OrderAttributes {
  table_number: number;
  status: OrderStatus;
  scheduled_at: string;
  notes: string | null;
  total_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface OrderData {
  type: "orders";
  id: string;
  attributes: OrderAttributes;
  relationships: {
    customer: { data: { type: "customers"; id: string } | null };
    lines: { data: { type: "order-lines"; id: string }[] };
  };
}

export interface CreateOrderLineDTO {
  dish_id: string;
  qty: number;
  unit_price_cents: number;
  notes?: string | null;
}

export interface CreateOrderDTO {
  table_number: number;
  customer_id?: string | null;
  scheduled_at: string;
  notes?: string | null;
  lines: CreateOrderLineDTO[];
}

export type OrderSearchScope = "table" | "dish" | "notes";

export const orderSearchScopes: readonly { key: OrderSearchScope; label: string }[] = [
  { key: "table", label: "Table" },
  { key: "dish", label: "Plat" },
  { key: "notes", label: "Notes" },
] as const;

export interface OrdersQuery {
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  search?: string;
  search_scope?: OrderSearchScope;
}

export const ordersKeys = {
  all: ["orders"] as const,
  list: (q: OrdersQuery) => ["orders", q] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

export function useOrders<I = unknown>(query: OrdersQuery = {}) {
  const client = useApiClient();

  return useQuery({
    queryKey: ordersKeys.list(query),
    queryFn: () =>
      client.apiList<OrderData, I>("/api/orders", {
        query: {
          status: query.status,
          page: query.page,
          pageSize: query.pageSize,
          from: query.from,
          to: query.to,
          search: query.search,
          search_scope: query.search_scope,
        },
      }),
    placeholderData: (prev) => prev,
  });
}

export function useOrder<I = unknown>(id: string | undefined) {
  const client = useApiClient();

  return useQuery({
    enabled: Boolean(id),
    queryKey: id ? ordersKeys.detail(id) : ["orders", "detail", "_none"],
    queryFn: () => client.apiSingleEnvelope<OrderData, I>(`/api/orders/${id}`),
  });
}

export function useCreateOrder() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<OrderData, Error, CreateOrderDTO>({
    mutationFn: (input) => client.apiPost<OrderData>("/api/orders", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useChangeOrderStatus() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<OrderData, Error, { id: string; status: OrderStatus }>({
    mutationFn: ({ id, status }) => client.apiPatch<OrderData>(`/api/orders/${id}/status`, { status }),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.detail(id) });
    },
  });
}

export function useCancelOrder() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<OrderData, Error, { id: string }>({
    mutationFn: ({ id }) => client.apiPost<OrderData>(`/api/orders/${id}/cancel`),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.detail(id) });
    },
  });
}

export type ApiOrdersList<I = unknown> = ApiList<OrderData, I>;
export type ApiOrder<I = unknown> = ApiSingle<OrderData, I>;
