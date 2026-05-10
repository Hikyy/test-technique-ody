import { z } from "zod";
import type { Order } from "../../domain/entities/order.js";

export const orderRelationshipsDataSchema = z.object({
  customer: z.object({
    data: z
      .object({
        type: z.literal("customers"),
        id: z.string().uuid(),
      })
      .nullable(),
  }),
  lines: z.object({
    data: z.array(
      z.object({
        type: z.literal("order-lines"),
        id: z.string().uuid(),
      }),
    ),
  }),
});

export type OrderRelationshipsData = z.infer<typeof orderRelationshipsDataSchema>;

export const toOrderRelationshipsData = (o: Order): OrderRelationshipsData => ({
  customer: {
    data: o.customerId ? { type: "customers", id: o.customerId } : null,
  },
  lines: {
    data: o.lines.map((l) => ({ type: "order-lines" as const, id: l.id })),
  },
});
