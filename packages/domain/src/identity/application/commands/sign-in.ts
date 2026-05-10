import { z } from "zod";
import type { UserData } from "../../interface/data/user.data.js";

export const signInDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type SignInDTO = z.infer<typeof signInDtoSchema>;

export interface SignInResult {
  user: UserData;
  token: string;
  expiresAt: string;
}
