import { useInfiniteQuery } from "@tanstack/react-query";
import { useApiClient } from "../context";
import type { CustomerData, CustomersQuery } from "./customers";
import { customersKeys } from "./customers";
import type { DishData, DishesQuery } from "./menu";
import { menuKeys } from "./menu";
import type { OrderData, OrdersQuery } from "./orders";
import { ordersKeys } from "./orders";

const DEFAULT_PAGE_SIZE = 20;

export function useInfiniteCustomers(query: CustomersQuery = {}) {
  const client = useApiClient();
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: ["infinite", ...customersKeys.list(query)],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      client.apiList<CustomerData>("/api/customers", {
        query: { search: query.search, search_scope: query.search_scope, page: pageParam, pageSize },
      }),
    getNextPageParam: (lastPage, _all, lastParam) => {
      const total = typeof lastPage.meta.total === "number" ? lastPage.meta.total : 0;
      const loaded = ((lastParam as number) ?? 1) * pageSize;

      return loaded < total ? (lastParam as number) + 1 : undefined;
    },
  });
}

export function useInfiniteOrders<I = unknown>(query: OrdersQuery = {}) {
  const client = useApiClient();
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: ["infinite", ...ordersKeys.list(query)],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      client.apiList<OrderData, I>("/api/orders", {
        query: {
          status: query.status,
          search: query.search,
          search_scope: query.search_scope,
          from: query.from,
          to: query.to,
          page: pageParam,
          pageSize,
        },
      }),
    getNextPageParam: (lastPage, _all, lastParam) => {
      const total = typeof lastPage.meta.total === "number" ? lastPage.meta.total : 0;
      const loaded = ((lastParam as number) ?? 1) * pageSize;

      return loaded < total ? (lastParam as number) + 1 : undefined;
    },
  });
}

export function useInfiniteDishes(query: DishesQuery = {}) {
  const client = useApiClient();
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: ["infinite", ...menuKeys.dishes(query)],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      client.apiList<DishData>("/api/menu/dishes", {
        query: {
          category_id: query.category_id,
          available: query.available,
          search: query.search,
          page: pageParam,
          pageSize,
        },
      }),
    getNextPageParam: (lastPage, _all, lastParam) => {
      const total = typeof lastPage.meta.total === "number" ? lastPage.meta.total : 0;
      const loaded = ((lastParam as number) ?? 1) * pageSize;

      return loaded < total ? (lastParam as number) + 1 : undefined;
    },
  });
}
