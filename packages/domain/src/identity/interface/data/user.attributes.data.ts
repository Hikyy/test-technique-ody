import { z } from "zod";
import type { User } from "../../domain/entities/user.js";

export const userAttributesDataSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  role: z.enum(["chef", "server", "admin"]),
  created_at: z.string().datetime(),
});

export type UserAttributesData = z.infer<typeof userAttributesDataSchema>;

export const toUserAttributesData = (u: User): UserAttributesData => ({
  email: u.email.value,
  name: u.name,
  role: u.role.value,
  created_at: u.createdAt.toISOString(),
});
