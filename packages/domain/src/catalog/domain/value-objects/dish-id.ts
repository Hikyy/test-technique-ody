import { type Id, newId, toId } from "../../../shared-kernel/id.js";

export type DishId = Id<"Dish">;
export const newDishId = (): DishId => newId<"Dish">();
export const toDishId = (raw: string): DishId => toId<"Dish">(raw);
