import { z } from 'zod';
import { customerDataSchema, type CustomerData } from '../../../customer/interface/data/customer.data.js';
import { dishDataSchema, type DishData } from '../../../catalog/interface/data/dish.data.js';
import { orderLineDataSchema, type OrderLineData } from './order-line.data.js';

export const orderIncludedSchema = z.union([
  customerDataSchema,
  orderLineDataSchema,
  dishDataSchema,
]);

export type OrderIncluded = CustomerData | OrderLineData | DishData;
