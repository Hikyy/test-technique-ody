import { z } from "zod";

const imageUrlSchema = z.string().refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), {
  message: "image_url must be an absolute URL or a relative path",
});

/**
 * Form-level schema for dish creation. Uses `price_eur` (user-facing
 * value) which the consumer converts to `price_cents` for the DTO.
 */
export const createDishSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  price_eur: z.coerce.number().min(0).max(100000),
  available: z.boolean(),
  image_url: imageUrlSchema.optional(),
});

export type CreateDishInput = z.infer<typeof createDishSchema>;

export const updateDishSchema = createDishSchema.partial();
export type UpdateDishInput = z.infer<typeof updateDishSchema>;
