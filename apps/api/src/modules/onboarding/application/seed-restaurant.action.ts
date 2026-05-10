import { db } from "@ody/db/client";
import {
  categories as categoriesTable,
  customers as customersTable,
  dishes as dishesTable,
  notifications as notificationsTable,
  type OrderStatus,
  orderLines,
  orders as ordersTable,
} from "@ody/db/schema";
import { SEED_CATEGORIES, SEED_CUSTOMERS, SEED_DISHES } from "@ody/db/seed-data";
import { Err, type NotFoundError, Ok, type Result } from "@ody/domain/shared-kernel";
import { eq } from "drizzle-orm";

export type SeedScope = "menu" | "customers" | "orders";

export interface SeedRestaurantInput {
  organizationId: string;
  restaurantId: string;
  scopes: SeedScope[];
}

export interface SeedRestaurantOutput {
  inserted: { categories: number; dishes: number; customers: number; orders: number; notifications: number };
}

function pick<T>(arr: ReadonlyArray<T>, rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)] as T;
}

function randInt(min: number, maxInclusive: number, rand: () => number): number {
  return Math.floor(rand() * (maxInclusive - min + 1)) + min;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;

  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATUS_DISTRIBUTION: ReadonlyArray<OrderStatus> = [
  "pending",
  "pending",
  "cooking",
  "cooking",
  "cooking",
  "sent",
  "sent",
  "served",
  "served",
  "served",
  "served",
  "served",
  "cancelled",
];

export async function seedRestaurant(input: SeedRestaurantInput): Promise<Result<SeedRestaurantOutput, NotFoundError>> {
  const { organizationId, restaurantId, scopes } = input;
  const wantsMenu = scopes.includes("menu");
  const wantsCustomers = scopes.includes("customers");
  const wantsOrders = scopes.includes("orders");

  const result: SeedRestaurantOutput = {
    inserted: { categories: 0, dishes: 0, customers: 0, orders: 0, notifications: 0 },
  };

  await db.transaction(async (tx) => {
    let categoryByName = new Map<string, string>();
    let dishesRows: Array<{ id: string; priceCents: number }> = [];

    if (wantsMenu) {
      const insertedCategories = await tx
        .insert(categoriesTable)
        .values(SEED_CATEGORIES.map((c) => ({ restaurantId, name: c.name, position: c.position })))
        .returning({ id: categoriesTable.id, name: categoriesTable.name });

      categoryByName = new Map(insertedCategories.map((r) => [r.name, r.id]));
      result.inserted.categories = insertedCategories.length;

      const dishRows = SEED_DISHES.map((d) => {
        const categoryId = categoryByName.get(d.category);

        if (!categoryId) throw new Error(`Unknown seed category: ${d.category}`);

        return {
          restaurantId,
          categoryId,
          name: d.name,
          description: d.description,
          priceCents: d.priceCents,
          available: d.available,
        };
      });

      dishesRows = await tx
        .insert(dishesTable)
        .values(dishRows)
        .returning({ id: dishesTable.id, priceCents: dishesTable.priceCents });
      result.inserted.dishes = dishesRows.length;
    }

    let customerIds: string[] = [];

    if (wantsCustomers) {
      const insertedCustomers = await tx
        .insert(customersTable)
        .values(
          SEED_CUSTOMERS.map((c) => ({
            organizationId,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email ?? null,
            phone: c.phone ?? null,
            notes: c.notes ?? null,
            visitsCount: c.visitsCount,
            spentCents: c.spentCents,
          })),
        )
        .returning({ id: customersTable.id });

      customerIds = insertedCustomers.map((r) => r.id);
      result.inserted.customers = customerIds.length;
    }

    if (wantsOrders) {
      let dishesForOrders = dishesRows;

      if (dishesForOrders.length === 0) {
        const existing = await tx
          .select({ id: dishesTable.id, priceCents: dishesTable.priceCents })
          .from(dishesTable)
          .where(eq(dishesTable.restaurantId, restaurantId))
          .limit(50);

        dishesForOrders = existing;
      }

      if (dishesForOrders.length === 0) return;

      let pool = customerIds;

      if (pool.length === 0) {
        const existing = await tx
          .select({ id: customersTable.id })
          .from(customersTable)
          .where(eq(customersTable.organizationId, organizationId))
          .limit(50);

        pool = existing.map((r) => r.id);
      }

      const rand = mulberry32(Number(restaurantId.replace(/-/g, "").slice(0, 8)) || 1);
      const now = Date.now();
      const orderRows: Array<{
        restaurantId: string;
        tableNumber: number;
        status: OrderStatus;
        customerId: string | null;
        scheduledAt: Date;
        totalCents: number;
        notes: string | null;
      }> = [];
      const linesPerOrder: Array<Array<{ dishId: string; qty: number; unitPriceCents: number }>> = [];

      for (let i = 0; i < STATUS_DISTRIBUTION.length; i++) {
        const status = STATUS_DISTRIBUTION[i] as OrderStatus;
        const lineCount = randInt(1, 4, rand);
        const used = new Set<string>();
        const lines: Array<{ dishId: string; qty: number; unitPriceCents: number }> = [];

        for (let j = 0; j < lineCount; j++) {
          let dish = pick(dishesForOrders, rand);
          let attempts = 0;

          while (used.has(dish.id) && attempts < 8) {
            dish = pick(dishesForOrders, rand);
            attempts++;
          }

          used.add(dish.id);
          lines.push({ dishId: dish.id, qty: randInt(1, 3, rand), unitPriceCents: dish.priceCents });
        }

        orderRows.push({
          restaurantId,
          tableNumber: randInt(1, 24, rand),
          status,
          customerId: pool.length > 0 && rand() < 0.7 ? pick(pool, rand) : null,
          scheduledAt: new Date(now - randInt(5, 60 * 24 * 7, rand) * 60_000),
          totalCents: lines.reduce((acc, l) => acc + l.qty * l.unitPriceCents, 0),
          notes: rand() < 0.2 ? "Allergie aux fruits à coque" : null,
        });
        linesPerOrder.push(lines);
      }

      const insertedOrders = await tx.insert(ordersTable).values(orderRows).returning({ id: ordersTable.id });
      const allLines = insertedOrders.flatMap((o, i) =>
        (linesPerOrder[i] ?? []).map((l) => ({
          orderId: o.id,
          dishId: l.dishId,
          qty: l.qty,
          unitPriceCents: l.unitPriceCents,
        })),
      );

      if (allLines.length > 0) await tx.insert(orderLines).values(allLines);

      result.inserted.orders = insertedOrders.length;

      await tx.insert(notificationsTable).values([
        {
          restaurantId,
          type: "system",
          title: "Bienvenue sur Sève",
          data: {},
          readAt: null,
        },
        {
          restaurantId,
          type: "order.created",
          title: "Premières commandes générées",
          data: { source: "onboarding" },
          readAt: null,
        },
      ]);
      result.inserted.notifications = 2;
    }
  });

  return Ok(result);
}

export const seedRestaurantAction = {
  execute: seedRestaurant,
} as const;

export { Err };
