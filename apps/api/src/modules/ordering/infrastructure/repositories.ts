import { dishRepository } from "../../catalog/infrastructure/repositories.js";
import { customerRepository } from "../../customer/infrastructure/repositories.js";
import { orderRepository } from "./persistence/drizzle-order.repository.js";

const clock = { now: (): Date => new Date() };

export { orderRepository };
export const orderingDeps = {
  orders: orderRepository,
  customers: customerRepository,
  dishes: dishRepository,
  clock,
};
