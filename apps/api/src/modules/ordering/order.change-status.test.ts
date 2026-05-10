import { newDishId } from "@ody/domain/catalog";
import { changeOrderStatus, Order, OrderLine, type OrderRepository, toOrderId } from "@ody/domain/ordering";
import { FixedClock, InvalidTransitionError, Money, NotFoundError, Ok } from "@ody/domain/shared-kernel";
import { describe, expect, it, vi } from "vitest";

const buildOrder = (): Order => {
  const line = OrderLine.create({
    dishId: newDishId(),
    qty: 2,
    unitPrice: Money.fromCents(1000),
  });
  if (!line.ok) throw new Error("setup");
  const order = Order.create({
    tableNumber: 4,
    scheduledAt: new Date("2026-05-08T19:00:00Z"),
    lines: [line.value],
  });
  if (!order.ok) throw new Error("setup");
  return order.value;
};

const fakeRepo = (overrides: Partial<OrderRepository> = {}): OrderRepository => ({
  findById: vi.fn().mockResolvedValue(Ok(null)),
  list: vi.fn().mockResolvedValue(Ok({ items: [], total: 0, page: 1, pageSize: 20 })),
  save: vi.fn().mockResolvedValue(Ok(undefined)),
  ...overrides,
});

describe("changeOrderStatus use case", () => {
  it("transitions a pending order to cooking and saves it", async () => {
    const order = buildOrder();
    const orders = fakeRepo({
      findById: vi.fn().mockResolvedValue(Ok(order)),
    });
    const clock = new FixedClock(new Date("2026-05-08T20:00:00Z"));

    const r = await changeOrderStatus({ id: order.id, patch: { status: "cooking" } }, { orders, clock });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status.value).toBe("cooking");
    expect(orders.save).toHaveBeenCalledOnce();
  });

  it("returns NotFoundError when order does not exist", async () => {
    const orders = fakeRepo();
    const clock = new FixedClock(new Date());

    const r = await changeOrderStatus(
      { id: toOrderId("00000000-0000-0000-0000-000000000000"), patch: { status: "cooking" } },
      { orders, clock },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(NotFoundError);
    expect(orders.save).not.toHaveBeenCalled();
  });

  it("returns InvalidTransitionError on illegal transition", async () => {
    const order = buildOrder();
    const orders = fakeRepo({
      findById: vi.fn().mockResolvedValue(Ok(order)),
    });
    const clock = new FixedClock(new Date());

    const r = await changeOrderStatus({ id: order.id, patch: { status: "served" } }, { orders, clock });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(InvalidTransitionError);
    expect(orders.save).not.toHaveBeenCalled();
  });
});
