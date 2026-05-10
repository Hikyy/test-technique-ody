import type { DomainError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import { Category } from "../../domain/entities/category.js";
import type { CategoryRepository } from "../../domain/repositories/category.repository.js";
import type { CreateCategoryDTO } from "../../interface/dto/catalog.dto.js";

export interface CreateCategoryDeps {
  categories: CategoryRepository;
}

export const createCategory = async (
  input: { restaurantId: string; data: CreateCategoryDTO },
  deps: CreateCategoryDeps,
): Promise<Result<Category, DomainError>> => {
  // If position not provided, place at the end. We compute that by reading the
  // current list length — fine for an onboarding flow where categories are few.
  let position = input.data.position;

  if (position === undefined) {
    const current = await deps.categories.list(input.restaurantId);
    if (!current.ok) return current;
    position = current.value.length;
  }

  const created = Category.create({ name: input.data.name, position });
  if (!created.ok) return created;

  const saved = await deps.categories.save(input.restaurantId, created.value);
  if (!saved.ok) return Err(saved.error);
  return Ok(created.value);
};

export const createCategoryAction = {
  execute: createCategory,
} as const;
