import { newDishId } from "@ody/domain/catalog";
import { createOrder, Order, type OrderRepository } from "@ody/domain/ordering";
import { FixedClock, Ok } from "@ody/domain/shared-kernel";
import { describe, expect, it, vi } from "vitest";

const TENANT = "00000000-0000-4000-8000-0000000000bb";

const fakeRepo = (overrides: Partial<OrderRepository> = {}): OrderRepository => ({
  findById: vi.fn().mockResolvedValue(Ok(null)),
  list: vi.fn().mockResolvedValue(Ok({ items: [], total: 0, page: 1, pageSize: 20 })),
  save: vi.fn().mockResolvedValue(Ok(undefined)),
  ...overrides,
});

const dishId = newDishId();

describe("createOrder use case", () => {
  it("returns Ok with computed total and saves the order", async () => {
    const orders = fakeRepo();
    const clock = new FixedClock(new Date("2026-05-08T19:00:00Z"));

    const r = await createOrder(
      {
        restaurantId: TENANT,
        data: {
          table_number: 5,
          scheduled_at: "2026-05-08T20:00:00Z",
          lines: [
            { dish_id: dishId, qty: 2, unit_price_cents: 1500 },
            { dish_id: dishId, qty: 1, unit_price_cents: 800 },
          ],
        },
      },
      { orders, clock },
    );

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBeInstanceOf(Order);
      expect(r.value.total().cents).toBe(2 * 1500 + 800);
      expect(r.value.status.value).toBe("pending");
      expect(r.value.lines).toHaveLength(2);
    }

    expect(orders.save).toHaveBeenCalledOnce();
    const call = vi.mocked(orders.save).mock.calls[0];
    expect(call?.[0]).toBe(TENANT);
    expect(call?.[1]).toBeInstanceOf(Order);
    expect(call?.[1]?.pullEvents().some((e) => e.type === "OrderCreated")).toBe(true);
  });

  it("returns Err if no lines provided (DTO-level invariant enforced by domain)", async () => {
    const orders = fakeRepo();
    const clock = new FixedClock(new Date());
    const r = await createOrder(
      {
        restaurantId: TENANT,
        data: {
          table_number: 5,
          scheduled_at: "2026-05-08T20:00:00Z",
          lines: [],
        },
      },
      { orders, clock },
    );
    expect(r.ok).toBe(false);
    expect(orders.save).not.toHaveBeenCalled();
  });

  it("returns Err if line qty is invalid (0)", async () => {
    const orders = fakeRepo();
    const clock = new FixedClock(new Date());
    const r = await createOrder(
      {
        restaurantId: TENANT,
        data: {
          table_number: 5,
          scheduled_at: "2026-05-08T20:00:00Z",
          lines: [{ dish_id: dishId, qty: 0, unit_price_cents: 1500 }],
        },
      },
      { orders, clock },
    );
    expect(r.ok).toBe(false);
    expect(orders.save).not.toHaveBeenCalled();
  });

  it("returns Err if tableNumber is out of range", async () => {
    const orders = fakeRepo();
    const clock = new FixedClock(new Date());
    const r = await createOrder(
      {
        restaurantId: TENANT,
        data: {
          table_number: 0,
          scheduled_at: "2026-05-08T20:00:00Z",
          lines: [{ dish_id: dishId, qty: 1, unit_price_cents: 1500 }],
        },
      },
      { orders, clock },
    );
    expect(r.ok).toBe(false);
    expect(orders.save).not.toHaveBeenCalled();
  });
});
