import type {
  CustomerIncludedData,
  DishIncludedData,
  OrderIncludedResource,
  OrderLineIncludedData,
} from "@/lib/hooks/use-orders";

export function lookupIncluded<T extends { type: string; id: string; attributes: unknown }>(
  included: readonly T[],
  type: T["type"],
  id: string,
): T | undefined {
  return included.find((r) => r.type === type && r.id === id);
}

export function findCustomer(included: readonly OrderIncludedResource[], id: string): CustomerIncludedData | undefined {
  return included.find((r): r is CustomerIncludedData => r.type === "customers" && r.id === id);
}

export function findOrderLine(
  included: readonly OrderIncludedResource[],
  id: string,
): OrderLineIncludedData | undefined {
  return included.find((r): r is OrderLineIncludedData => r.type === "order-lines" && r.id === id);
}

export function findDish(included: readonly OrderIncludedResource[], id: string): DishIncludedData | undefined {
  return included.find((r): r is DishIncludedData => r.type === "dishes" && r.id === id);
}

export interface ResolvedOrderLine {
  id: string;
  qty: number;
  unitPriceCents: number;
  currency: string;
  notes: string | null;
  dishId: string;
  dishName: string;
  lineTotalCents: number;
}

export function resolveOrderLines(
  lineRefs: readonly { type: "order-lines"; id: string }[],
  included: readonly OrderIncludedResource[],
): ResolvedOrderLine[] {
  const out: ResolvedOrderLine[] = [];
  for (const ref of lineRefs) {
    const line = findOrderLine(included, ref.id);
    if (!line) continue;
    const dishId = line.relationships.dish.data.id;
    const dish = findDish(included, dishId);
    out.push({
      id: line.id,
      qty: line.attributes.qty,
      unitPriceCents: line.attributes.unit_price_cents,
      currency: line.attributes.currency,
      notes: line.attributes.notes,
      dishId,
      dishName: dish?.attributes.name ?? "Article",
      lineTotalCents: line.attributes.qty * line.attributes.unit_price_cents,
    });
  }
  return out;
}
