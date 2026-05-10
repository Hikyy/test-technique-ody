import type { PagedResult } from "../../../customer/domain/repositories/customer.repository.js";
import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { Dish } from "../entities/dish.js";
import type { CategoryId } from "../value-objects/category-id.js";
import type { DishId } from "../value-objects/dish-id.js";

export interface ListDishesOptions {
  restaurantId: string;
  categoryId?: CategoryId;
  available?: boolean;
  search?: string;
  page: number;
  pageSize: number;
}

export interface DishRepository {
  findById(restaurantId: string, id: DishId): Promise<Result<Dish | null, DomainError>>;
  findByIds(restaurantId: string, ids: DishId[]): Promise<Result<Dish[], DomainError>>;
  list(opts: ListDishesOptions): Promise<Result<PagedResult<Dish>, DomainError>>;
  save(restaurantId: string, dish: Dish): Promise<Result<void, DomainError>>;
  delete(restaurantId: string, id: DishId): Promise<Result<void, DomainError>>;
}
