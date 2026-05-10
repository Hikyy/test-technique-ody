import { db } from "@ody/db/client";
import { Err, NotFoundError, Ok, type Result } from "@ody/domain/shared-kernel";
import { sql } from "drizzle-orm";

export interface OnboardingStatus {
  restaurantId: string;
  name: string;
  onboardedAt: Date | null;
  counts: {
    categories: number;
    dishes: number;
    customers: number;
    orders: number;
  };
}

export async function showOnboardingStatus(restaurantId: string): Promise<Result<OnboardingStatus, NotFoundError>> {
  const rows = await db.execute(sql<{
    id: string;
    name: string;
    onboarded_at: Date | null;
    categories: number;
    dishes: number;
    customers: number;
    orders: number;
  }>`
    SELECT
      r.id,
      r.name,
      r.onboarded_at,
      (SELECT count(*)::int FROM categories WHERE organization_id = r.organization_id) AS categories,
      (SELECT count(*)::int FROM dishes      WHERE organization_id = r.organization_id) AS dishes,
      (SELECT count(*)::int FROM customers   WHERE organization_id = r.organization_id) AS customers,
      (SELECT count(*)::int FROM orders      WHERE restaurant_id   = r.id)              AS orders
    FROM restaurants r
    WHERE r.id = ${restaurantId}
    LIMIT 1
  `);

  const r = rows.rows[0] as
    | {
        id: string;
        name: string;
        onboarded_at: Date | null;
        categories: number;
        dishes: number;
        customers: number;
        orders: number;
      }
    | undefined;

  if (!r) return Err(new NotFoundError("Restaurant", restaurantId));

  return Ok({
    restaurantId: r.id,
    name: r.name,
    onboardedAt: r.onboarded_at instanceof Date ? r.onboarded_at : r.onboarded_at ? new Date(r.onboarded_at) : null,
    counts: {
      categories: Number(r.categories),
      dishes: Number(r.dishes),
      customers: Number(r.customers),
      orders: Number(r.orders),
    },
  });
}

export const showOnboardingStatusAction = {
  execute: showOnboardingStatus,
} as const;
