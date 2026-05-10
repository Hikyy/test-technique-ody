import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../context";

export type InvitationRole = "manager" | "staff";

export interface InvitationAttributes {
  email: string;
  role: "owner" | "manager" | "staff";
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  invite_url?: string;
}

export interface InvitationData {
  type: "invitations";
  id: string;
  attributes: InvitationAttributes;
  relationships: { restaurant: { data: { type: "restaurants"; id: string } } };
}

export interface CreateInvitationDTO {
  email: string;
  role: InvitationRole;
}

export const invitationsKeys = {
  all: ["invitations"] as const,
};

export function useInvitations() {
  const client = useApiClient();

  return useQuery({
    queryKey: invitationsKeys.all,
    queryFn: () => client.apiList<InvitationData>("/api/invitations"),
    staleTime: 30_000,
  });
}

export function useCreateInvitation() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<InvitationData, Error, CreateInvitationDTO>({
    mutationFn: (input) => client.apiPost<InvitationData>("/api/invitations", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: invitationsKeys.all });
    },
  });
}

export function useRevokeInvitation() {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => client.apiDelete<void>(`/api/invitations/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: invitationsKeys.all });
    },
  });
}
