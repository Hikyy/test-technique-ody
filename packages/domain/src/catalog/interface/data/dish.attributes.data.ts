import { z } from "zod";
import type { Dish } from "../../domain/entities/dish.js";

export const dishAttributesDataSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().nullable(),
  price_cents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3),
  available: z.boolean(),
  image_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
});

export type DishAttributesData = z.infer<typeof dishAttributesDataSchema>;

export const toDishAttributesData = (d: Dish): DishAttributesData => ({
  name: d.name,
  description: d.description,
  price_cents: d.price.cents,
  currency: d.price.currency,
  available: d.available,
  image_url: d.imageUrl,
  created_at: d.createdAt.toISOString(),
});
