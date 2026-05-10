import { type Id, newId, toId } from "../../../shared-kernel/id.js";

export type UserId = Id<"User">;
export const newUserId = (): UserId => newId<"User">();
export const toUserId = (raw: string): UserId => toId<"User">(raw);
