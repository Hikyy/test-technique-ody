import { type Id, newId, toId } from "../../../shared-kernel/id.js";

export type CustomerId = Id<"Customer">;
export const newCustomerId = (): CustomerId => newId<"Customer">();
export const toCustomerId = (raw: string): CustomerId => toId<"Customer">(raw);
