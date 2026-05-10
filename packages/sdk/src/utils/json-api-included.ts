export interface CustomerIncluded {
  type: "customers";
  id: string;
  attributes: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    notes?: string | null;
    visits_count: number;
    spent_cents: number;
    currency: string;
    created_at?: string;
    updated_at?: string;
  };
  relationships: Record<string, unknown>;
}

export interface OrderLineIncluded {
  type: "order-lines";
  id: string;
  attributes: {
    qty: number;
    unit_price_cents: number;
    currency: string;
    notes: string | null;
  };
  relationships: { dish: { data: { type: "dishes"; id: string } } };
}

export interface DishIncluded {
  type: "dishes";
  id: string;
  attributes: {
    name: string;
    description: string | null;
    price_cents: number;
    currency: string;
    available: boolean;
    image_url: string | null;
  };
  relationships: { category: { data: { type: "categories"; id: string } } };
}

export type OrderIncludedResource = CustomerIncluded | OrderLineIncluded | DishIncluded;

export function findCustomer(included: readonly OrderIncludedResource[], id: string): CustomerIncluded | undefined {
  return included.find((r): r is CustomerIncluded => r.type === "customers" && r.id === id);
}

export function findOrderLine(included: readonly OrderIncludedResource[], id: string): OrderLineIncluded | undefined {
  return included.find((r): r is OrderLineIncluded => r.type === "order-lines" && r.id === id);
}

export function findDish(included: readonly OrderIncludedResource[], id: string): DishIncluded | undefined {
  return included.find((r): r is DishIncluded => r.type === "dishes" && r.id === id);
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
  refs: readonly { id: string; type?: string }[],
  included: readonly OrderIncludedResource[],
): ResolvedOrderLine[] {
  const out: ResolvedOrderLine[] = [];

  for (const ref of refs) {
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
