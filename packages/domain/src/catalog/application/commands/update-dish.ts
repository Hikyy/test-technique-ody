import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import { Money } from "../../../shared-kernel/money.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { Dish } from "../../domain/entities/dish.js";
import type { DishRepository } from "../../domain/repositories/dish.repository.js";
import { toCategoryId } from "../../domain/value-objects/category-id.js";
import type { DishId } from "../../domain/value-objects/dish-id.js";
import type { UpdateDishDTO } from "../../interface/dto/catalog.dto.js";

export interface UpdateDishDeps {
  dishes: DishRepository;
}

export const updateDish = async (
  input: { restaurantId: string; id: DishId; patch: UpdateDishDTO },
  deps: UpdateDishDeps,
): Promise<Result<Dish, DomainError>> => {
  const found = await deps.dishes.findById(input.restaurantId, input.id);
  if (!found.ok) return found;
  if (!found.value) return Err(new NotFoundError("Dish", input.id));
  const dish = found.value;

  const upd = dish.update({
    name: input.patch.name,
    description: input.patch.description ?? undefined,
    imageUrl: input.patch.image_url ?? undefined,
    categoryId: input.patch.category_id ? toCategoryId(input.patch.category_id) : undefined,
  });
  if (!upd.ok) return upd;

  if (input.patch.price_cents !== undefined) {
    const r = dish.changePrice(Money.fromCents(input.patch.price_cents));
    if (!r.ok) return r;
  }
  if (input.patch.available !== undefined) {
    dish.setAvailable(input.patch.available);
  }

  const saved = await deps.dishes.save(input.restaurantId, dish);
  if (!saved.ok) return Err(saved.error);
  return Ok(dish);
};

export const updateDishAction = {
  execute: updateDish,
} as const;
