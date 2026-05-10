import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { DishRepository } from "../../domain/repositories/dish.repository.js";
import type { DishId } from "../../domain/value-objects/dish-id.js";

export interface DeleteDishDeps {
  dishes: DishRepository;
}

export const deleteDish = (
  input: { restaurantId: string; id: DishId },
  deps: DeleteDishDeps,
): Promise<Result<void, DomainError>> => deps.dishes.delete(input.restaurantId, input.id);

export const deleteDishAction = {
  execute: deleteDish,
} as const;
