import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["manager", "staff"]),
});
export type CreateInvitationDTOType = z.infer<typeof createInvitationSchema>;
export type CreateInvitationDTO = CreateInvitationDTOType;
export const CreateInvitationRequest = createInvitationSchema;
export const CreateInvitationDTO = {
  fromRequest: (req: CreateInvitationDTOType): CreateInvitationDTOType => req,
} as const;

export const acceptInvitationSchema = z.object({
  token: z.string().min(20),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(128),
});
export type AcceptInvitationDTOType = z.infer<typeof acceptInvitationSchema>;
export type AcceptInvitationDTO = AcceptInvitationDTOType;
export const AcceptInvitationRequest = acceptInvitationSchema;
export const AcceptInvitationDTO = {
  fromRequest: (req: AcceptInvitationDTOType): AcceptInvitationDTOType => req,
} as const;

export const invitationTokenLookupSchema = z.object({
  token: z.string().min(20),
});
export type InvitationTokenLookupDTOType = z.infer<typeof invitationTokenLookupSchema>;
export type InvitationTokenLookupDTO = InvitationTokenLookupDTOType;
export const InvitationTokenLookupRequest = invitationTokenLookupSchema;
export const InvitationTokenLookupDTO = {
  fromRequest: (req: InvitationTokenLookupDTOType): InvitationTokenLookupDTOType => req,
} as const;
