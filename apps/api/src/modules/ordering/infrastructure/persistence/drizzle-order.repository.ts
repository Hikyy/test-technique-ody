import { db } from "@ody/db/client";
import { dishes, orderLines, orders } from "@ody/db/schema";
import { toDishId } from "@ody/domain/catalog";
import type { PagedResult } from "@ody/domain/customer";
import { toCustomerId } from "@ody/domain/customer";
import {
  type ListOrdersOptions,
  Order,
  type OrderId,
  OrderLine,
  type OrderRepository,
  OrderStatus,
  toOrderId,
  toOrderLineId,
} from "@ody/domain/ordering";
import { type DomainError, Money, type Result } from "@ody/domain/shared-kernel";
import { and, asc, desc, eq, exists, gte, ilike, inArray, lte, type SQL, sql } from "drizzle-orm";
import { runQuery } from "../../../shared/run-query.js";

interface OrderRow {
  id: string;
  tableNumber: number;
  status: string;
  customerId: string | null;
  scheduledAt: Date;
  totalCents: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderLineRow {
  id: string;
  orderId: string;
  dishId: string;
  qty: number;
  unitPriceCents: number;
  notes: string | null;
}

const rowToOrder = (head: OrderRow, lineRows: OrderLineRow[]): Order => {
  const lines = lineRows.map((l) =>
    OrderLine.restore({
      id: toOrderLineId(l.id),
      dishId: toDishId(l.dishId),
      qty: l.qty,
      unitPrice: Money.fromCents(l.unitPriceCents),
      notes: l.notes,
    }),
  );
  const status = OrderStatus.create(head.status);

  return Order.restore({
    id: toOrderId(head.id),
    tableNumber: head.tableNumber,
    status: status.ok ? status.value : OrderStatus.pending,
    customerId: head.customerId ? toCustomerId(head.customerId) : null,
    scheduledAt: head.scheduledAt,
    lines,
    notes: head.notes,
    createdAt: head.createdAt,
    updatedAt: head.updatedAt,
  });
};

export class DrizzleOrderRepository implements OrderRepository {
  findById(restaurantId: string, id: OrderId): Promise<Result<Order | null, DomainError>> {
    return runQuery(async () => {
      const rows = await db
        .select()
        .from(orders)
        .where(and(eq(orders.restaurantId, restaurantId), eq(orders.id, id)))
        .limit(1);
      const head = rows[0];

      if (!head) return null;

      const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, id));

      return rowToOrder(head as OrderRow, lines as OrderLineRow[]);
    });
  }

  list(opts: ListOrdersOptions): Promise<Result<PagedResult<Order>, DomainError>> {
    return runQuery(async () => {
      const offset = (opts.page - 1) * opts.pageSize;
      const filters: SQL[] = [eq(orders.restaurantId, opts.restaurantId)];

      if (opts.status) filters.push(eq(orders.status, opts.status));

      if (opts.from) filters.push(gte(orders.createdAt, opts.from));

      if (opts.to) filters.push(lte(orders.createdAt, opts.to));

      const needle = opts.search?.trim();
      const scope = opts.search_scope ?? "table";

      if (needle) {
        if (scope === "table") {
          const tableNum = Number.parseInt(needle, 10);

          if (Number.isFinite(tableNum)) {
            filters.push(eq(orders.tableNumber, tableNum));
          } else {
            filters.push(sql`false`);
          }
        } else if (scope === "notes") {
          filters.push(ilike(orders.notes, `%${needle}%`));
        } else {
          filters.push(
            exists(
              db
                .select({ one: sql`1` })
                .from(orderLines)
                .innerJoin(dishes, eq(dishes.id, orderLines.dishId))
                .where(and(eq(orderLines.orderId, orders.id), ilike(dishes.name, `%${needle}%`))),
            ),
          );
        }
      }

      const where = and(...filters);

      const heads = await db
        .select()
        .from(orders)
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(opts.pageSize)
        .offset(offset);

      const totalRows = await db.select({ count: sql<number>`count(*)::int` }).from(orders).where(where);

      const ids = heads.map((h) => (h as OrderRow).id);
      const linesAll =
        ids.length > 0
          ? await db.select().from(orderLines).where(inArray(orderLines.orderId, ids)).orderBy(asc(orderLines.id))
          : [];

      const linesByOrder = new Map<string, OrderLineRow[]>();

      for (const l of linesAll as OrderLineRow[]) {
        const arr = linesByOrder.get(l.orderId) ?? [];

        arr.push(l);
        linesByOrder.set(l.orderId, arr);
      }

      return {
        items: heads.map((h) => rowToOrder(h as OrderRow, linesByOrder.get((h as OrderRow).id) ?? [])),
        total: totalRows[0]?.count ?? 0,
        page: opts.page,
        pageSize: opts.pageSize,
      };
    });
  }

  save(restaurantId: string, order: Order): Promise<Result<void, DomainError>> {
    return runQuery(async () => {
      const head = {
        id: order.id,
        restaurantId,
        tableNumber: order.tableNumber,
        status: order.status.value,
        customerId: order.customerId,
        scheduledAt: order.scheduledAt,
        totalCents: order.total().cents,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
      const lineRows = order.lines.map((l) => ({
        id: l.id,
        orderId: order.id,
        dishId: l.dishId,
        qty: l.qty,
        unitPriceCents: l.unitPrice.cents,
        notes: l.notes,
      }));

      await db.transaction(async (tx) => {
        await tx
          .insert(orders)
          .values(head)
          .onConflictDoUpdate({
            target: orders.id,
            setWhere: eq(orders.restaurantId, restaurantId),
            set: {
              tableNumber: head.tableNumber,
              status: head.status,
              customerId: head.customerId,
              scheduledAt: head.scheduledAt,
              totalCents: head.totalCents,
              notes: head.notes,
              updatedAt: head.updatedAt,
            },
          });
        await tx.delete(orderLines).where(eq(orderLines.orderId, head.id));

        if (lineRows.length > 0) await tx.insert(orderLines).values(lineRows);
      });
    });
  }
}

export const orderRepository = new DrizzleOrderRepository();
