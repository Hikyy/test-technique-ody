import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { Category } from "../entities/category.js";
import type { CategoryId } from "../value-objects/category-id.js";

export interface CategoryRepository {
  findById(restaurantId: string, id: CategoryId): Promise<Result<Category | null, DomainError>>;
  list(restaurantId: string): Promise<Result<Category[], DomainError>>;
  save(restaurantId: string, category: Category): Promise<Result<void, DomainError>>;
  delete(restaurantId: string, id: CategoryId): Promise<Result<void, DomainError>>;
}
