import type { DomainError } from "../../../shared-kernel/errors.js";
import { Ok, type Result } from "../../../shared-kernel/result.js";
import type { Dish } from "../../domain/entities/dish.js";
import type { DishRepository } from "../../domain/repositories/dish.repository.js";
import { toCategoryId } from "../../domain/value-objects/category-id.js";
import type { ListDishesFiltersDTO } from "../../interface/dto/catalog.dto.js";

export interface ListDishesDeps {
  dishes: DishRepository;
}

export interface ListDishesResult {
  items: Dish[];
  total: number;
  page: number;
  pageSize: number;
}

export const listDishes = async (
  input: { restaurantId: string; filters: ListDishesFiltersDTO },
  deps: ListDishesDeps,
): Promise<Result<ListDishesResult, DomainError>> => {
  const r = await deps.dishes.list({
    restaurantId: input.restaurantId,
    categoryId: input.filters.category_id ? toCategoryId(input.filters.category_id) : undefined,
    available: input.filters.available,
    search: input.filters.search,
    page: input.filters.page,
    pageSize: input.filters.pageSize,
  });
  if (!r.ok) return r;
  return Ok({
    items: r.value.items,
    total: r.value.total,
    page: r.value.page,
    pageSize: r.value.pageSize,
  });
};

export const listDishesAction = {
  execute: listDishes,
} as const;
