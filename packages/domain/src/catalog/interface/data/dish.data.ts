import { z } from "zod";
import type { Dish } from "../../domain/entities/dish.js";
import { dishAttributesDataSchema, toDishAttributesData } from "./dish.attributes.data.js";
import { dishRelationshipsDataSchema, toDishRelationshipsData } from "./dish.relationships.data.js";

export const dishDataSchema = z.object({
  type: z.literal("dishes"),
  id: z.string().uuid(),
  attributes: dishAttributesDataSchema,
  relationships: dishRelationshipsDataSchema,
});

export type DishData = z.infer<typeof dishDataSchema>;

export const toDishData = (d: Dish): DishData => ({
  type: "dishes",
  id: d.id,
  attributes: toDishAttributesData(d),
  relationships: toDishRelationshipsData(d),
});

export const DishData = {
  schema: dishDataSchema,
  fromModel: toDishData,
  collect: (xs: readonly Dish[]): DishData[] => xs.map(toDishData),
} as const;
