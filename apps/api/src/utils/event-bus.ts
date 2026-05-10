import { EventEmitter } from "node:events";

export type OrderCreatedEvent = {
  restaurantId: string;
  orderId: string;
  tableNumber: number;
  status: string;
};

export type OrderStatusChangedEvent = {
  restaurantId: string;
  orderId: string;
  from: string;
  to: string;
};

type Events = {
  "order:created": OrderCreatedEvent;
  "order:status-changed": OrderStatusChangedEvent;
};

class TypedEventBus extends EventEmitter {
  override emit<K extends keyof Events>(event: K, payload: Events[K]): boolean {
    return super.emit(event, payload);
  }
  override on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): this {
    return super.on(event, listener);
  }
  override off<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): this {
    return super.off(event, listener);
  }
}

export const eventBus = new TypedEventBus();
eventBus.setMaxListeners(0);
