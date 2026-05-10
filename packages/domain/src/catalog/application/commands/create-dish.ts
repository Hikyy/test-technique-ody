import type { DomainError } from "../../../shared-kernel/errors.js";
import { Money } from "../../../shared-kernel/money.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import { Dish } from "../../domain/entities/dish.js";
import type { DishRepository } from "../../domain/repositories/dish.repository.js";
import { toCategoryId } from "../../domain/value-objects/category-id.js";
import type { CreateDishDTO } from "../../interface/dto/catalog.dto.js";

export interface CreateDishDeps {
  dishes: DishRepository;
}

export const createDish = async (
  input: { restaurantId: string; data: CreateDishDTO },
  deps: CreateDishDeps,
): Promise<Result<Dish, DomainError>> => {
  const created = Dish.create({
    categoryId: toCategoryId(input.data.category_id),
    name: input.data.name,
    description: input.data.description ?? null,
    price: Money.fromCents(input.data.price_cents),
    available: input.data.available,
    imageUrl: input.data.image_url ?? null,
  });
  if (!created.ok) return created;

  const saved = await deps.dishes.save(input.restaurantId, created.value);
  if (!saved.ok) return Err(saved.error);
  return Ok(created.value);
};

export const createDishAction = {
  execute: createDish,
} as const;
