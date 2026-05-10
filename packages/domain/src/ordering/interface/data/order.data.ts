import { z } from "zod";
import type { Order } from "../../domain/entities/order.js";
import { orderAttributesDataSchema, orderStatusSchema, toOrderAttributesData } from "./order.attributes.data.js";
import { orderRelationshipsDataSchema, toOrderRelationshipsData } from "./order.relationships.data.js";

export { orderStatusSchema };

export const orderDataSchema = z.object({
  type: z.literal("orders"),
  id: z.string().uuid(),
  attributes: orderAttributesDataSchema,
  relationships: orderRelationshipsDataSchema,
});

export type OrderData = z.infer<typeof orderDataSchema>;

export const toOrderData = (o: Order): OrderData => ({
  type: "orders",
  id: o.id,
  attributes: toOrderAttributesData(o),
  relationships: toOrderRelationshipsData(o),
});

export const OrderData = {
  schema: orderDataSchema,
  fromModel: toOrderData,
  collect: (xs: readonly Order[]): OrderData[] => xs.map(toOrderData),
} as const;
