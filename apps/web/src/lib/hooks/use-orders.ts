"use client";

import { useQuery } from "@tanstack/react-query";
import { type ApiList, apiList } from "@/lib/api-client";

export type OrderStatus = "pending" | "cooking" | "sent" | "served" | "cancelled";

export interface OrderAttributesData {
  table_number: number;
  status: OrderStatus;
  scheduled_at: string;
  notes: string | null;
  total_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface OrderLineRef {
  type: "order-lines";
  id: string;
}

export interface OrderRelationshipsData {
  customer: { data: { type: "customers"; id: string } | null };
  lines: { data: OrderLineRef[] };
}

export interface OrderData {
  type: "orders";
  id: string;
  attributes: OrderAttributesData;
  relationships: OrderRelationshipsData;
}

export interface CustomerIncludedData {
  type: "customers";
  id: string;
  attributes: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    notes?: string | null;
    visits_count: number;
    spent_cents: number;
    currency: string;
    created_at?: string;
    updated_at?: string;
  };
  relationships: Record<string, unknown>;
}

export interface OrderLineIncludedData {
  type: "order-lines";
  id: string;
  attributes: {
    qty: number;
    unit_price_cents: number;
    currency: string;
    notes: string | null;
  };
  relationships: {
    dish: { data: { type: "dishes"; id: string } };
  };
}

export interface DishIncludedData {
  type: "dishes";
  id: string;
  attributes: {
    name: string;
    description: string | null;
    price_cents: number;
    currency: string;
    available: boolean;
    image_url: string | null;
    created_at?: string;
  };
  relationships: {
    category: { data: { type: "categories"; id: string } };
  };
}

export type OrderIncludedResource = CustomerIncludedData | OrderLineIncludedData | DishIncludedData;

export type OrderListResponse = ApiList<OrderData, OrderIncludedResource>;

export type OrderSearchScope = "table" | "dish" | "notes";

export interface OrdersQueryParams {
  status?: OrderStatus | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  search?: string | undefined;
  search_scope?: OrderSearchScope | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

function toQueryString(params: OrdersQueryParams): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.search_scope) sp.set("search_scope", params.search_scope);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function buildOrdersKey(params: OrdersQueryParams): readonly unknown[] {
  return ["orders", params] as const;
}

export function useOrders(params: OrdersQueryParams) {
  return useQuery<OrderListResponse>({
    queryKey: buildOrdersKey(params),
    queryFn: () => apiList<OrderData, OrderIncludedResource>(`/api/orders${toQueryString(params)}`),
    placeholderData: (prev) => prev,
  });
}
