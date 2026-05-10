import { db } from "@ody/db/client";
import { orders, reservations, restaurantTables } from "@ody/db/schema";
import { CreateOrderDTO, CreateOrderRequest, createOrderAction, OrderData } from "@ody/domain/ordering";
import { and, eq } from "drizzle-orm";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { eventBus } from "../../../../../utils/event-bus.js";
import { orderingDeps } from "../../repositories.js";

export const StoreOrderController = {
  tag: "ordering",
  summary: "Create an order",
  request: CreateOrderRequest,
  response: { single: OrderData.schema, status: 201, description: "Created" },

  async __invoke({ body, context }) {
    const data = CreateOrderDTO.fromRequest(body);
    const order = await createOrderAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, data },
      orderingDeps,
    );

    if (!order.ok) return order;

    // Persist optional table_id / reservation_id (off the entity surface).
    // Defense-in-depth: validate both belong to the active restaurant before linking.
    const restaurantId = context.var.restaurant.restaurantId;

    if (data.table_id) {
      const [tbl] = await db
        .select({ id: restaurantTables.id })
        .from(restaurantTables)
        .where(and(eq(restaurantTables.id, data.table_id), eq(restaurantTables.restaurantId, restaurantId)))
        .limit(1);

      if (!tbl) data.table_id = null;
    }

    if (data.reservation_id) {
      const [resa] = await db
        .select({ id: reservations.id })
        .from(reservations)
        .where(and(eq(reservations.id, data.reservation_id), eq(reservations.restaurantId, restaurantId)))
        .limit(1);

      if (!resa) data.reservation_id = null;
    }

    if (data.table_id || data.reservation_id) {
      await db
        .update(orders)
        .set({
          ...(data.table_id ? { tableId: data.table_id } : {}),
          ...(data.reservation_id ? { reservationId: data.reservation_id } : {}),
        })
        .where(eq(orders.id, order.value.id));
    }

    eventBus.emit("order:created", {
      restaurantId: context.var.restaurant.restaurantId,
      orderId: order.value.id,
      tableNumber: order.value.tableNumber,
      status: order.value.status.value,
    });

    return OrderData.fromModel(order.value);
  },
} satisfies ControllerSpec;
