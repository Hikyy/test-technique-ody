import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";

export interface CategoryAttributes {
  name: string;
  position: number;
  created_at: string;
}

export interface CategoryData {
  type: "categories";
  id: string;
  attributes: CategoryAttributes;
}

export interface DishAttributes {
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  available: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DishData {
  type: "dishes";
  id: string;
  attributes: DishAttributes;
  relationships: { category: { data: { type: "categories"; id: string } } };
}

export interface CreateDishDTO {
  category_id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  available?: boolean;
  image_url?: string | null;
}

export type UpdateDishDTO = Partial<CreateDishDTO>;

export interface CreateCategoryDTO {
  name: string;
  position?: number;
}

export interface DishesQuery {
  category_id?: string;
  available?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const menuKeys = {
  categories: ["menu", "categories"] as const,
  dishesAll: ["menu", "dishes"] as const,
  dishes: (q: DishesQuery) => ["menu", "dishes", q] as const,
};

export function useCategories() {
  const client = useApiClient();

  return useQuery({
    queryKey: menuKeys.categories,
    queryFn: () => client.apiList<CategoryData>("/api/menu/categories"),
    staleTime: 60_000,
  });
}

export function useDishes(query: DishesQuery = {}) {
  const client = useApiClient();

  return useQuery({
    queryKey: menuKeys.dishes(query),
    queryFn: () =>
      client.apiList<DishData>("/api/menu/dishes", {
        query: {
          category_id: query.category_id,
          available: query.available,
          search: query.search,
          page: query.page,
          pageSize: query.pageSize,
        },
      }),
    placeholderData: (prev) => prev,
  });
}

type ListShape<T> = { items: T[]; included: unknown[]; meta: unknown; links: unknown };

export function useCreateCategory() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<CategoryData, Error, CreateCategoryDTO>({
    mutationFn: (input) => client.apiPost<CategoryData>("/api/menu/categories", input),
    onSuccess: (created) => {
      qc.setQueriesData<ListShape<CategoryData>>({ queryKey: menuKeys.categories }, (prev) =>
        prev ? { ...prev, items: [...prev.items, created] } : prev,
      );
    },
  });
}

export function useCreateDish() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<DishData, Error, CreateDishDTO>({
    mutationFn: (input) => client.apiPost<DishData>("/api/menu/dishes", input),
    onSuccess: (created) => {
      qc.setQueriesData<ListShape<DishData>>({ queryKey: menuKeys.dishesAll }, (prev) =>
        prev ? { ...prev, items: [...prev.items, created] } : prev,
      );
    },
  });
}

export function useUpdateDish() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<DishData, Error, { id: string; patch: UpdateDishDTO }>({
    mutationFn: ({ id, patch }) => client.apiPatch<DishData>(`/api/menu/dishes/${id}`, patch),
    onSuccess: (updated) => {
      qc.setQueriesData<ListShape<DishData>>({ queryKey: menuKeys.dishesAll }, (prev) =>
        prev ? { ...prev, items: prev.items.map((d) => (d.id === updated.id ? updated : d)) } : prev,
      );
    },
  });
}

export function useToggleDishAvailability() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<DishData, Error, { id: string }>({
    mutationFn: ({ id }) => client.apiPost<DishData>(`/api/menu/dishes/${id}/toggle-availability`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: menuKeys.dishesAll });
    },
  });
}

export function useDeleteDish() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => client.apiDelete<void>(`/api/menu/dishes/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: menuKeys.dishesAll });
    },
  });
}
