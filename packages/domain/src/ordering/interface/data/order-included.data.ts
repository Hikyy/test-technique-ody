import { z } from "zod";
import { type DishData, dishDataSchema } from "../../../catalog/interface/data/dish.data.js";
import { type CustomerData, customerDataSchema } from "../../../customer/interface/data/customer.data.js";
import { type OrderLineData, orderLineDataSchema } from "./order-line.data.js";

export const orderIncludedSchema = z.union([customerDataSchema, orderLineDataSchema, dishDataSchema]);

export type OrderIncluded = CustomerData | OrderLineData | DishData;
