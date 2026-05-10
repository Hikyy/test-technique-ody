import { z } from "zod";

export const invitationAttributesSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "manager", "staff"]),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime(),
  accepted_at: z.string().datetime().nullable(),
  invite_url: z.string().url().optional(),
});
export type InvitationAttributesData = z.infer<typeof invitationAttributesSchema>;

export const invitationRelationshipsSchema = z.object({
  restaurant: z.object({
    data: z.object({ type: z.literal("restaurants"), id: z.string() }),
  }),
});
export type InvitationRelationshipsData = z.infer<typeof invitationRelationshipsSchema>;

export const invitationDataSchema = z.object({
  type: z.literal("invitations"),
  id: z.string(),
  attributes: invitationAttributesSchema,
  relationships: invitationRelationshipsSchema,
});
export type InvitationData = z.infer<typeof invitationDataSchema>;

export interface InvitationModel {
  id: string;
  restaurantId: string;
  email: string;
  role: "owner" | "manager" | "staff";
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  inviteUrl?: string;
}

export const toInvitationData = (m: InvitationModel): InvitationData => ({
  type: "invitations",
  id: m.id,
  attributes: {
    email: m.email,
    role: m.role,
    expires_at: m.expiresAt.toISOString(),
    created_at: m.createdAt.toISOString(),
    accepted_at: m.acceptedAt ? m.acceptedAt.toISOString() : null,
    ...(m.inviteUrl ? { invite_url: m.inviteUrl } : {}),
  },
  relationships: {
    restaurant: { data: { type: "restaurants", id: m.restaurantId } },
  },
});

export const InvitationData = {
  schema: invitationDataSchema,
  fromModel: toInvitationData,
  collect: (xs: InvitationModel[]): InvitationData[] => xs.map(toInvitationData),
} as const;
