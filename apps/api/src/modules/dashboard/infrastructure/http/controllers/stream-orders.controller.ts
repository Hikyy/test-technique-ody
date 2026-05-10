import { streamSSE } from "hono/streaming";
import { describeRoute } from "hono-openapi";
import { factory } from "../../../../../factory.js";
import { eventBus, type OrderCreatedEvent, type OrderStatusChangedEvent } from "../../../../../utils/event-bus.js";

const meta = describeRoute({
  tags: ["dashboard"],
  summary: "SSE stream of order events",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "SSE stream of order lifecycle events",
      content: { "text/event-stream": { schema: { type: "string" } } },
    },
  },
});

export const streamOrders = {
  path: "/api/dashboard/stream",
  handlers: factory.createHandlers(meta, (c) => {
    const restaurantId = c.var.restaurant.restaurantId;

    c.header("Cache-Control", "no-cache, no-transform");
    c.header("Connection", "keep-alive");
    c.header("X-Accel-Buffering", "no");

    return streamSSE(c, async (stream) => {
      let counter = 0;

      const nextId = (): string => {
        counter += 1;

        return String(counter);
      };

      const onCreated = (payload: OrderCreatedEvent): void => {
        if (payload.restaurantId !== restaurantId) return;

        void stream.writeSSE({
          event: "order-created",
          data: JSON.stringify(payload),
          id: nextId(),
        });
      };

      const onChanged = (payload: OrderStatusChangedEvent): void => {
        if (payload.restaurantId !== restaurantId) return;

        void stream.writeSSE({
          event: "order-status-changed",
          data: JSON.stringify(payload),
          id: nextId(),
        });
      };

      eventBus.on("order:created", onCreated);
      eventBus.on("order:status-changed", onChanged);

      stream.onAbort(() => {
        eventBus.off("order:created", onCreated);
        eventBus.off("order:status-changed", onChanged);
      });

      await stream.writeSSE({
        event: "ready",
        data: JSON.stringify({ ts: Date.now() }),
        id: nextId(),
      });

      while (!stream.aborted && !stream.closed) {
        await stream.sleep(30_000);

        if (stream.aborted || stream.closed) break;

        await stream.writeSSE({
          event: "ping",
          data: JSON.stringify({ ts: Date.now() }),
          id: nextId(),
        });
      }

      eventBus.off("order:created", onCreated);
      eventBus.off("order:status-changed", onChanged);
    });
  }),
};
