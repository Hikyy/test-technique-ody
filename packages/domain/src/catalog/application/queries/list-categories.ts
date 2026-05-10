import type { DomainError } from "../../../shared-kernel/errors.js";
import { Ok, type Result } from "../../../shared-kernel/result.js";
import type { Category } from "../../domain/entities/category.js";
import type { CategoryRepository } from "../../domain/repositories/category.repository.js";

export interface ListCategoriesDeps {
  categories: CategoryRepository;
}

export interface ListCategoriesResult {
  items: Category[];
  total: number;
  page: number;
  pageSize: number;
}

export const listCategories = async (
  input: { restaurantId: string },
  deps: ListCategoriesDeps,
): Promise<Result<ListCategoriesResult, DomainError>> => {
  const r = await deps.categories.list(input.restaurantId);
  if (!r.ok) return r;
  return Ok({
    items: r.value,
    total: r.value.length,
    page: 1,
    pageSize: r.value.length || 1,
  });
};

export const listCategoriesAction = {
  execute: listCategories,
} as const;
