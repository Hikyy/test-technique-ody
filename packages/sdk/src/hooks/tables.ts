import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";

export interface TableAttributes {
  label: string;
  capacity: number;
  position: number;
  created_at: string;
}

export interface TableData {
  type: "restaurant-tables";
  id: string;
  attributes: TableAttributes;
}

export interface CreateTableDTO {
  label: string;
  capacity: number;
  position?: number;
}

export type UpdateTableDTO = Partial<CreateTableDTO>;

export const tablesKeys = {
  all: ["tables"] as const,
};

export function useTables() {
  const client = useApiClient();
  return useQuery({
    queryKey: tablesKeys.all,
    queryFn: () => client.apiList<TableData>("/api/tables"),
    staleTime: 60_000,
  });
}

export function useCreateTable() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation<TableData, Error, CreateTableDTO>({
    mutationFn: (input) => client.apiPost<TableData>("/api/tables", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: tablesKeys.all }),
  });
}

export function useUpdateTable() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation<TableData, Error, { id: string; patch: UpdateTableDTO }>({
    mutationFn: ({ id, patch }) => client.apiPatch<TableData>(`/api/tables/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: tablesKeys.all }),
  });
}

export function useDeleteTable() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => client.apiDelete<void>(`/api/tables/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: tablesKeys.all }),
  });
}
