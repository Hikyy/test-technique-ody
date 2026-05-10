import { z } from "zod";
import type { User } from "../../domain/entities/user.js";

export const userRelationshipsDataSchema = z.object({}).strict();

export type UserRelationshipsData = z.infer<typeof userRelationshipsDataSchema>;

export const toUserRelationshipsData = (_u: User): UserRelationshipsData => ({});
