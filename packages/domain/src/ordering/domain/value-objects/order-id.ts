import { type Id, newId, toId } from "../../../shared-kernel/id.js";

export type OrderId = Id<"Order">;
export const newOrderId = (): OrderId => newId<"Order">();
export const toOrderId = (raw: string): OrderId => toId<"Order">(raw);

export type OrderLineId = Id<"OrderLine">;
export const newOrderLineId = (): OrderLineId => newId<"OrderLine">();
export const toOrderLineId = (raw: string): OrderLineId => toId<"OrderLine">(raw);
