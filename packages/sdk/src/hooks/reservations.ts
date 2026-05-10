import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";

export type ReservationStatus = "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";

export interface ReservationAttributes {
  table_id: string;
  table_label: string;
  customer_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  party_size: number;
  starts_at: string;
  ends_at: string;
  status: ReservationStatus;
  notes: string | null;
}

export interface ReservationData {
  type: "reservations";
  id: string;
  attributes: ReservationAttributes;
}

export interface CreateReservationDTO {
  table_id: string;
  customer_id?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  party_size: number;
  starts_at: string;
  ends_at: string;
  status?: ReservationStatus;
  notes?: string | null;
}

export type UpdateReservationDTO = Partial<CreateReservationDTO>;

export interface ReservationsQuery {
  from?: string;
  to?: string;
  status?: string;
}

export const reservationsKeys = {
  all: ["reservations"] as const,
  list: (q: ReservationsQuery) => ["reservations", q] as const,
};

export function useReservations(query: ReservationsQuery = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: reservationsKeys.list(query),
    queryFn: () =>
      client.apiList<ReservationData>("/api/reservations", {
        query: { from: query.from, to: query.to, status: query.status },
      }),
    placeholderData: (prev) => prev,
  });
}

export function useCreateReservation() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation<ReservationData, Error, CreateReservationDTO>({
    mutationFn: (input) => client.apiPost<ReservationData>("/api/reservations", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationsKeys.all }),
  });
}

export function useUpdateReservation() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation<ReservationData, Error, { id: string; patch: UpdateReservationDTO }>({
    mutationFn: ({ id, patch }) => client.apiPatch<ReservationData>(`/api/reservations/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationsKeys.all }),
  });
}

export function useDeleteReservation() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => client.apiDelete<void>(`/api/reservations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationsKeys.all }),
  });
}
