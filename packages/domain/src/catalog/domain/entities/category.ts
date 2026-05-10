import { type DomainError, ValidationError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import { type CategoryId, newCategoryId } from "../value-objects/category-id.js";

export interface CategoryProps {
  id: CategoryId;
  name: string;
  position: number;
}

export class Category {
  private constructor(private props: CategoryProps) {}

  static create(input: { id?: CategoryId; name: string; position: number }): Result<Category, DomainError> {
    const trimmed = input.name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      return Err(new ValidationError("Category.name length must be 1..80"));
    }
    if (!Number.isInteger(input.position) || input.position < 0) {
      return Err(new ValidationError("Category.position must be a non-negative integer"));
    }
    return Ok(
      new Category({
        id: input.id ?? newCategoryId(),
        name: trimmed,
        position: input.position,
      }),
    );
  }

  static restore(props: CategoryProps): Category {
    return new Category(props);
  }

  get id(): CategoryId {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get position(): number {
    return this.props.position;
  }

  rename(name: string): Result<void, DomainError> {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      return Err(new ValidationError("Category.name length must be 1..80"));
    }
    this.props = { ...this.props, name: trimmed };
    return Ok(undefined);
  }

  reorder(position: number): Result<void, DomainError> {
    if (!Number.isInteger(position) || position < 0) {
      return Err(new ValidationError("Category.position must be a non-negative integer"));
    }
    this.props = { ...this.props, position };
    return Ok(undefined);
  }
}
