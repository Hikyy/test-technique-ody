import { z } from "zod";

export const orderLineSchema = z.object({
  dish_id: z.string().uuid(),
  qty: z.coerce.number().int().min(1).max(99),
  unit_price_cents: z.coerce.number().int().nonnegative(),
  notes: z.string().max(500).optional(),
});

export type OrderLineInput = z.infer<typeof orderLineSchema>;

export const createOrderSchema = z.object({
  table_number: z.coerce.number().int().min(1).max(99),
  table_id: z.string().uuid().optional().or(z.literal("")),
  reservation_id: z.string().uuid().optional().or(z.literal("")),
  customer_id: z.string().uuid().optional().or(z.literal("")),
  scheduled_at: z.string().min(1),
  notes: z.string().max(2000).optional(),
  lines: z.array(orderLineSchema).min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
