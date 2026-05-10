import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { Dish } from "../../domain/entities/dish.js";
import type { DishRepository } from "../../domain/repositories/dish.repository.js";
import type { DishId } from "../../domain/value-objects/dish-id.js";

export interface ToggleDishAvailabilityDeps {
  dishes: DishRepository;
}

export const toggleDishAvailability = async (
  input: { restaurantId: string; id: DishId },
  deps: ToggleDishAvailabilityDeps,
): Promise<Result<Dish, DomainError>> => {
  const found = await deps.dishes.findById(input.restaurantId, input.id);
  if (!found.ok) return found;
  if (!found.value) return Err(new NotFoundError("Dish", input.id));
  found.value.toggleAvailability();
  const saved = await deps.dishes.save(input.restaurantId, found.value);
  if (!saved.ok) return Err(saved.error);
  return Ok(found.value);
};

export const toggleDishAvailabilityAction = {
  execute: toggleDishAvailability,
} as const;
