import { z } from "zod";
import type { Category } from "../../domain/entities/category.js";

export const categoryAttributesDataSchema = z.object({
  name: z.string().min(1).max(80),
  position: z.number().int().nonnegative(),
});

export type CategoryAttributesData = z.infer<typeof categoryAttributesDataSchema>;

export const toCategoryAttributesData = (c: Category): CategoryAttributesData => ({
  name: c.name,
  position: c.position,
});
