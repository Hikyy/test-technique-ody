import {
  ChangeOrderStatusDTO,
  ChangeOrderStatusRequest,
  changeOrderStatusAction,
  OrderData,
  toOrderId,
} from "@ody/domain/ordering";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { eventBus } from "../../../../../utils/event-bus.js";
import { orderingDeps } from "../../repositories.js";

export const ChangeOrderStatusController = {
  tag: "ordering",
  summary: "Change order status",
  params: z.object({ id: z.string().min(1) }),
  request: ChangeOrderStatusRequest,
  response: { single: OrderData.schema, status: 200, description: "Updated" },

  async __invoke({ params, body, context }) {
    const orderId = toOrderId(params.id);
    const restaurantId = context.var.restaurant.restaurantId;
    const dto = ChangeOrderStatusDTO.fromRequest(body);
    const previous = await orderingDeps.orders.findById(restaurantId, orderId);
    const fromStatus = previous.ok && previous.value ? previous.value.status.value : "";
    const order = await changeOrderStatusAction.execute({ restaurantId, id: orderId, patch: dto }, orderingDeps);

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
