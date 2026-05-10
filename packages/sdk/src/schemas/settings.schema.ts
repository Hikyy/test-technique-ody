import { z } from "zod";

export const updateSettingsIdentitySchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(240).optional(),
  phone: z.string().max(40).optional(),
  contact_email: z.string().email().or(z.literal("")).optional(),
});

export type UpdateSettingsIdentityInput = z.infer<typeof updateSettingsIdentitySchema>;
