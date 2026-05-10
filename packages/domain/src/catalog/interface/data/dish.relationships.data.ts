import { z } from "zod";
import type { Dish } from "../../domain/entities/dish.js";

export const dishRelationshipsDataSchema = z.object({
  category: z.object({
    data: z.object({
      type: z.literal("categories"),
      id: z.string().uuid(),
    }),
  }),
});

export type DishRelationshipsData = z.infer<typeof dishRelationshipsDataSchema>;

export const toDishRelationshipsData = (d: Dish): DishRelationshipsData => ({
  category: { data: { type: "categories", id: d.categoryId } },
});
