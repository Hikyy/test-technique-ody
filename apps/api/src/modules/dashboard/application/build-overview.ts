import { db } from "@ody/db/client";
import { dishes, orderLines, orders } from "@ody/db/schema";
import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";

const SparkPoint = z.object({ date: z.string(), value: z.number() });

const TopDish = z.object({
  dish_id: z.string(),
  name: z.string(),
  qty: z.number().int(),
  revenue_cents: z.number().int(),
});

const KpiCard = z.object({
  value: z.number(),
  delta: z.number(),
  spark: z.array(SparkPoint),
});

export const overviewSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  couverts_du_jour: KpiCard,
  ca_estime: KpiCard,
  panier_moyen: KpiCard,
  taux_annulation: KpiCard,
  top_plats: z.array(TopDish),
});

export type Overview = z.infer<typeof overviewSchema>;

const startOfDay = (d: Date): Date => {
  const x = new Date(d);

  x.setHours(0, 0, 0, 0);

  return x;
};

const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);

  x.setDate(x.getDate() + n);

  return x;
};

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

export async function buildOverview(now: Date, restaurantId: string): Promise<Overview> {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const sevenAgo = addDays(today, -6);
  const fourteenAgo = addDays(today, -13);

  const dailyAgg = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      orderCount: sql<number>`count(*)::int`,
      cancelled: sql<number>`count(*) FILTER (WHERE ${orders.status} = 'cancelled')::int`,
      revenueCents: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} <> 'cancelled' THEN ${orders.totalCents} ELSE 0 END), 0)::bigint`,
      coversCount: sql<number>`count(*) FILTER (WHERE ${orders.status} <> 'cancelled')::int`,
    })
    .from(orders)
    .where(and(eq(orders.restaurantId, restaurantId), gte(orders.createdAt, fourteenAgo)))
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`);

  const byDay = new Map<string, (typeof dailyAgg)[number]>();

  for (const row of dailyAgg) byDay.set(row.day, row);

  const buildSpark = (pick: (r: (typeof dailyAgg)[number]) => number): { date: string; value: number }[] => {
    const out: { date: string; value: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const key = isoDay(d);
      const row = byDay.get(key);

      out.push({ date: key, value: row ? Number(pick(row)) : 0 });
    }

    return out;
  };

  const sumOver = (from: Date, to: Date, pick: (r: (typeof dailyAgg)[number]) => number): number => {
    let sum = 0;

    for (const [day, row] of byDay) {
      const d = new Date(day);

      if (d >= from && d < to) sum += Number(pick(row));
    }

    return sum;
  };

  const todayCovers = sumOver(today, tomorrow, (r) => r.coversCount);
  const yesterdayCovers = sumOver(addDays(today, -1), today, (r) => r.coversCount);
  const couverts_du_jour = {
    value: todayCovers,
    delta: yesterdayCovers === 0 ? 0 : (todayCovers - yesterdayCovers) / yesterdayCovers,
    spark: buildSpark((r) => r.coversCount),
  };

  const last7Revenue = sumOver(sevenAgo, tomorrow, (r) => r.revenueCents);
  const prev7Revenue = sumOver(addDays(fourteenAgo, 0), sevenAgo, (r) => r.revenueCents);
  const ca_estime = {
    value: last7Revenue,
    delta: prev7Revenue === 0 ? 0 : (last7Revenue - prev7Revenue) / prev7Revenue,
    spark: buildSpark((r) => r.revenueCents),
  };

  const last7Orders = sumOver(sevenAgo, tomorrow, (r) => r.coversCount);
  const prev7Orders = sumOver(addDays(fourteenAgo, 0), sevenAgo, (r) => r.coversCount);
  const avg = last7Orders === 0 ? 0 : Math.round(last7Revenue / last7Orders);
  const prevAvg = prev7Orders === 0 ? 0 : Math.round(prev7Revenue / prev7Orders);
  const panier_moyen = {
    value: avg,
    delta: prevAvg === 0 ? 0 : (avg - prevAvg) / prevAvg,
    spark: buildSpark((r) => (r.coversCount === 0 ? 0 : Math.round(Number(r.revenueCents) / r.coversCount))),
  };

  const last7Total = sumOver(sevenAgo, tomorrow, (r) => r.orderCount);
  const last7Cancelled = sumOver(sevenAgo, tomorrow, (r) => r.cancelled);
  const prev7Total = sumOver(addDays(fourteenAgo, 0), sevenAgo, (r) => r.orderCount);
  const prev7Cancelled = sumOver(addDays(fourteenAgo, 0), sevenAgo, (r) => r.cancelled);
  const rate = last7Total === 0 ? 0 : last7Cancelled / last7Total;
  const prevRate = prev7Total === 0 ? 0 : prev7Cancelled / prev7Total;
  const taux_annulation = {
    value: rate,
    delta: prevRate === 0 ? 0 : (rate - prevRate) / prevRate,
    spark: buildSpark((r) => (r.orderCount === 0 ? 0 : r.cancelled / r.orderCount)),
  };

  const topPlatsRows = await db
    .select({
      dishId: orderLines.dishId,
      name: dishes.name,
      qty: sql<number>`SUM(${orderLines.qty})::int`,
      revenueCents: sql<number>`SUM(${orderLines.qty} * ${orderLines.unitPriceCents})::bigint`,
    })
    .from(orderLines)
    .innerJoin(orders, eq(orders.id, orderLines.orderId))
    .innerJoin(dishes, eq(dishes.id, orderLines.dishId))
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        gte(orders.createdAt, sevenAgo),
        ne(orders.status, "cancelled"),
        lt(orders.createdAt, tomorrow),
      ),
    )
    .groupBy(orderLines.dishId, dishes.name)
    .orderBy(sql`SUM(${orderLines.qty}) DESC`)
    .limit(5);

  const top_plats = topPlatsRows.map((r) => ({
    dish_id: r.dishId,
    name: r.name,
    qty: Number(r.qty),
    revenue_cents: Number(r.revenueCents),
  }));

  return {
    range: { from: isoDay(sevenAgo), to: isoDay(today) },
    couverts_du_jour,
    ca_estime,
    panier_moyen,
    taux_annulation,
    top_plats,
  };
}
