import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(20),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(128),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
