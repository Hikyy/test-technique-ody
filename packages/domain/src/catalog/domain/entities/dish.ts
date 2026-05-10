import { type DomainError, ValidationError } from "../../../shared-kernel/errors.js";
import type { Money } from "../../../shared-kernel/money.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { CategoryId } from "../value-objects/category-id.js";
import { type DishId, newDishId } from "../value-objects/dish-id.js";

export interface DishProps {
  id: DishId;
  categoryId: CategoryId;
  name: string;
  description: string | null;
  price: Money;
  available: boolean;
  imageUrl: string | null;
  createdAt: Date;
}

export interface CreateDishInput {
  id?: DishId;
  categoryId: CategoryId;
  name: string;
  description?: string | null;
  price: Money;
  available?: boolean;
  imageUrl?: string | null;
  createdAt?: Date;
}

export class Dish {
  private constructor(private props: DishProps) {}

  static create(input: CreateDishInput): Result<Dish, DomainError> {
    const trimmed = input.name.trim();
    if (trimmed.length < 1 || trimmed.length > 120) {
      return Err(new ValidationError("Dish.name length must be 1..120"));
    }
    if (input.price.isNegative()) {
      return Err(new ValidationError("Dish.price cannot be negative"));
    }
    return Ok(
      new Dish({
        id: input.id ?? newDishId(),
        categoryId: input.categoryId,
        name: trimmed,
        description: input.description?.trim() || null,
        price: input.price,
        available: input.available ?? true,
        imageUrl: input.imageUrl ?? null,
        createdAt: input.createdAt ?? new Date(),
      }),
    );
  }

  static restore(props: DishProps): Dish {
    return new Dish(props);
  }

  get id(): DishId {
    return this.props.id;
  }
  get categoryId(): CategoryId {
    return this.props.categoryId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get price(): Money {
    return this.props.price;
  }
  get available(): boolean {
    return this.props.available;
  }
  get imageUrl(): string | null {
    return this.props.imageUrl;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toggleAvailability(): void {
    this.props = { ...this.props, available: !this.props.available };
  }

  setAvailable(available: boolean): void {
    this.props = { ...this.props, available };
  }

  changePrice(price: Money): Result<void, DomainError> {
    if (price.isNegative()) {
      return Err(new ValidationError("Dish.price cannot be negative"));
    }
    this.props = { ...this.props, price };
    return Ok(undefined);
  }

  update(patch: {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    categoryId?: CategoryId;
  }): Result<void, DomainError> {
    const next = { ...this.props };
    if (patch.name !== undefined) {
      const t = patch.name.trim();
      if (t.length < 1 || t.length > 120) {
        return Err(new ValidationError("Dish.name length must be 1..120"));
      }
      next.name = t;
    }
    if (patch.description !== undefined) {
      next.description = patch.description?.trim() || null;
    }
    if (patch.imageUrl !== undefined) next.imageUrl = patch.imageUrl;
    if (patch.categoryId !== undefined) next.categoryId = patch.categoryId;
    this.props = next;
    return Ok(undefined);
  }
}
