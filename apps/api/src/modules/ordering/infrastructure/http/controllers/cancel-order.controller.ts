import { cancelOrderAction, OrderData, toOrderId } from "@ody/domain/ordering";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { eventBus } from "../../../../../utils/event-bus.js";
import { orderingDeps } from "../../repositories.js";

export const CancelOrderController = {
  tag: "ordering",
  summary: "Cancel an order",
  params: z.object({ id: z.string().min(1) }),
  response: { single: OrderData.schema, status: 200, description: "Cancelled" },

  async __invoke({ params, context }) {
    const orderId = toOrderId(params.id);
    const restaurantId = context.var.restaurant.restaurantId;
    const previous = await orderingDeps.orders.findById(restaurantId, orderId);
    const fromStatus = previous.ok && previous.value ? previous.value.status.value : "";
    const order = await cancelOrderAction.execute({ restaurantId, id: orderId }, orderingDeps);

    if (!order.ok) return order;

    eventBus.emit("order:status-changed", {
      restaurantId,
      orderId: order.value.id,
      from: fromStatus,
      to: order.value.status.value,
    });

    return OrderData.fromModel(order.value);
  },
} satisfies ControllerSpec;
