import type { DishId } from "../../../catalog/domain/value-objects/dish-id.js";
import { type DomainError, ValidationError } from "../../../shared-kernel/errors.js";
import type { Money } from "../../../shared-kernel/money.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import { newOrderLineId, type OrderLineId } from "../value-objects/order-id.js";

export interface OrderLineProps {
  id: OrderLineId;
  dishId: DishId;
  qty: number;
  unitPrice: Money;
  notes: string | null;
}

export class OrderLine {
  private constructor(private props: OrderLineProps) {}

  static create(input: {
    id?: OrderLineId;
    dishId: DishId;
    qty: number;
    unitPrice: Money;
    notes?: string | null;
  }): Result<OrderLine, DomainError> {
    if (!Number.isInteger(input.qty) || input.qty < 1 || input.qty > 99) {
      return Err(new ValidationError("OrderLine.qty must be integer 1..99"));
    }
    if (input.unitPrice.isNegative()) {
      return Err(new ValidationError("OrderLine.unitPrice cannot be negative"));
    }
    return Ok(
      new OrderLine({
        id: input.id ?? newOrderLineId(),
        dishId: input.dishId,
        qty: input.qty,
        unitPrice: input.unitPrice,
        notes: input.notes ?? null,
      }),
    );
  }

  static restore(props: OrderLineProps): OrderLine {
    return new OrderLine(props);
  }

  get id(): OrderLineId {
    return this.props.id;
  }
  get dishId(): DishId {
    return this.props.dishId;
  }
  get qty(): number {
    return this.props.qty;
  }
  get unitPrice(): Money {
    return this.props.unitPrice;
  }
  get notes(): string | null {
    return this.props.notes;
  }

  lineTotal(): Money {
    return this.unitPrice.multiply(this.qty);
  }
}
