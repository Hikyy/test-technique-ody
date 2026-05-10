import { z } from 'zod';
import type { OrderLine } from '../../domain/entities/order-line.js';
import {
  orderLineAttributesDataSchema,
  toOrderLineAttributesData,
} from './order-line.attributes.data.js';
import {
  orderLineRelationshipsDataSchema,
  toOrderLineRelationshipsData,
} from './order-line.relationships.data.js';

export const orderLineDataSchema = z.object({
  type: z.literal('order-lines'),
  id: z.string().uuid(),
  attributes: orderLineAttributesDataSchema,
  relationships: orderLineRelationshipsDataSchema,
});

export type OrderLineData = z.infer<typeof orderLineDataSchema>;

export const toOrderLineData = (l: OrderLine): OrderLineData => ({
  type: 'order-lines',
  id: l.id,
  attributes: toOrderLineAttributesData(l),
  relationships: toOrderLineRelationshipsData(l),
});
