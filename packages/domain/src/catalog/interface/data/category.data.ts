import { z } from "zod";
import type { Category } from "../../domain/entities/category.js";
import { categoryAttributesDataSchema, toCategoryAttributesData } from "./category.attributes.data.js";
import { categoryRelationshipsDataSchema, toCategoryRelationshipsData } from "./category.relationships.data.js";

export const categoryDataSchema = z.object({
  type: z.literal("categories"),
  id: z.string().uuid(),
  attributes: categoryAttributesDataSchema,
  relationships: categoryRelationshipsDataSchema,
});

export type CategoryData = z.infer<typeof categoryDataSchema>;

export const toCategoryData = (c: Category): CategoryData => ({
  type: "categories",
  id: c.id,
  attributes: toCategoryAttributesData(c),
  relationships: toCategoryRelationshipsData(c),
});

export const CategoryData = {
  schema: categoryDataSchema,
  fromModel: toCategoryData,
  collect: (xs: readonly Category[]): CategoryData[] => xs.map(toCategoryData),
} as const;
