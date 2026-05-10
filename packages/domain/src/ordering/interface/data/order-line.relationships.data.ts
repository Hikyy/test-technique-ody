import { z } from "zod";
import type { OrderLine } from "../../domain/entities/order-line.js";

export const orderLineRelationshipsDataSchema = z.object({
  dish: z.object({
    data: z.object({
      type: z.literal("dishes"),
      id: z.string().uuid(),
    }),
  }),
});

export type OrderLineRelationshipsData = z.infer<typeof orderLineRelationshipsDataSchema>;

export const toOrderLineRelationshipsData = (l: OrderLine): OrderLineRelationshipsData => ({
  dish: { data: { type: "dishes", id: l.dishId } },
});
