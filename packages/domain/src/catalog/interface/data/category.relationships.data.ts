import { z } from "zod";
import type { Category } from "../../domain/entities/category.js";

export const categoryRelationshipsDataSchema = z.object({
  dishes: z.object({
    data: z.array(
      z.object({
        type: z.literal("dishes"),
        id: z.string().uuid(),
      }),
    ),
  }),
});

export type CategoryRelationshipsData = z.infer<typeof categoryRelationshipsDataSchema>;

export const toCategoryRelationshipsData = (_c: Category): CategoryRelationshipsData => ({
  dishes: { data: [] },
});
