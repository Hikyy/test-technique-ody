import { type Id, newId, toId } from "../../../shared-kernel/id.js";

export type CategoryId = Id<"Category">;
export const newCategoryId = (): CategoryId => newId<"Category">();
export const toCategoryId = (raw: string): CategoryId => toId<"Category">(raw);
