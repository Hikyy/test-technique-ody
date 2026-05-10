import { randomUUID } from "node:crypto";
import { createNotificationAction } from "@ody/domain/notification";
import { logger } from "../../../log.js";
import { eventBus, type OrderCreatedEvent, type OrderStatusChangedEvent } from "../../../utils/event-bus.js";
import { notificationRepository } from "./repositories.js";

const deps = { notifications: notificationRepository, generateId: () => randomUUID() };

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  cooking: "En cuisine",
  sent: "Envoyée",
  served: "Servie",
  cancelled: "Annulée",
};

async function onOrderCreated(payload: OrderCreatedEvent): Promise<void> {
  const result = await createNotificationAction.execute(
    {
      restaurantId: payload.restaurantId,
      type: "order.created",
      title: `Nouvelle commande · table ${payload.tableNumber}`,
      data: { orderId: payload.orderId, tableNumber: payload.tableNumber, status: payload.status },
    },
    deps,
  );

  if (!result.ok) logger.warn({ err: result.error }, "failed to create order.created notification");
}

async function onOrderStatusChanged(payload: OrderStatusChangedEvent): Promise<void> {
  const isCancellation = payload.to === "cancelled";
  const toLabel = STATUS_LABELS[payload.to] ?? payload.to;
  const fromLabel = STATUS_LABELS[payload.from] ?? payload.from;

  const result = await createNotificationAction.execute(
    {
      restaurantId: payload.restaurantId,
      type: isCancellation ? "order.cancelled" : "order.status_changed",
      title: isCancellation
        ? `Commande annulée · ${fromLabel} → ${toLabel}`
        : `Statut commande · ${fromLabel} → ${toLabel}`,
      data: { orderId: payload.orderId, from: payload.from, to: payload.to },
    },
    deps,
  );

  if (!result.ok) logger.warn({ err: result.error }, "failed to create order.status_changed notification");
}

let registered = false;

export function registerNotificationListeners(): void {
  if (registered) return;

  eventBus.on("order:created", (p) => {
    void onOrderCreated(p);
  });
  eventBus.on("order:status-changed", (p) => {
    void onOrderStatusChanged(p);
  });

  registered = true;
}
