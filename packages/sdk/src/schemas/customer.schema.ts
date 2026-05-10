import { z } from "zod";

/**
 * Form-level schema for creating a customer. Field names match the
 * JSON:API DTO (`@ody/domain/customer`) so values can be sent without
 * additional renaming. Optional fields accept empty strings; consumers
 * normalize empty strings to `null` before submission.
 */
export const createCustomerSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
