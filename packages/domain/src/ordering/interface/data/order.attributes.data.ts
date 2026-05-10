import { z } from "zod";
import type { Order } from "../../domain/entities/order.js";
import { ORDER_STATUS_VALUES, type OrderStatusValue } from "../../domain/value-objects/order-status.js";

export const orderStatusSchema = z.enum(ORDER_STATUS_VALUES as readonly [OrderStatusValue, ...OrderStatusValue[]]);

export const orderAttributesDataSchema = z.object({
  table_number: z.number().int().min(1).max(99),
  status: orderStatusSchema,
  scheduled_at: z.string().datetime(),
  notes: z.string().nullable(),
  total_cents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type OrderAttributesData = z.infer<typeof orderAttributesDataSchema>;

export const toOrderAttributesData = (o: Order): OrderAttributesData => {
  const total = o.total();
  return {
    table_number: o.tableNumber,
    status: o.status.value,
    scheduled_at: o.scheduledAt.toISOString(),
    notes: o.notes,
    total_cents: total.cents,
    currency: total.currency,
    created_at: o.createdAt.toISOString(),
    updated_at: o.updatedAt.toISOString(),
  };
};
