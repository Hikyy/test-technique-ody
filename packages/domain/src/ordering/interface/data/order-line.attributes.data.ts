import { z } from 'zod';
import type { OrderLine } from '../../domain/entities/order-line.js';

export const orderLineAttributesDataSchema = z.object({
  qty: z.number().int().min(1).max(99),
  unit_price_cents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3),
  notes: z.string().nullable(),
});

export type OrderLineAttributesData = z.infer<typeof orderLineAttributesDataSchema>;

export const toOrderLineAttributesData = (l: OrderLine): OrderLineAttributesData => ({
  qty: l.qty,
  unit_price_cents: l.unitPrice.cents,
  currency: l.unitPrice.currency,
  notes: l.notes,
});
