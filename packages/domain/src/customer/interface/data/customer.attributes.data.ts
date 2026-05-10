import { z } from 'zod';
import type { Customer } from '../../domain/entities/customer.js';

export const customerAttributesDataSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  visits_count: z.number().int().nonnegative(),
  spent_cents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type CustomerAttributesData = z.infer<typeof customerAttributesDataSchema>;

export const toCustomerAttributesData = (c: Customer): CustomerAttributesData => ({
  first_name: c.firstName,
  last_name: c.lastName,
  email: c.email?.value ?? null,
  phone: c.phone?.value ?? null,
  notes: c.notes,
  visits_count: c.visitsCount,
  spent_cents: c.spent.cents,
  currency: c.spent.currency,
  created_at: c.createdAt.toISOString(),
  updated_at: c.updatedAt.toISOString(),
});
