import { z } from 'zod';
import type { Customer } from '../../domain/entities/customer.js';
import {
  customerAttributesDataSchema,
  toCustomerAttributesData,
} from './customer.attributes.data.js';
import {
  customerRelationshipsDataSchema,
  toCustomerRelationshipsData,
} from './customer.relationships.data.js';

export const customerDataSchema = z.object({
  type: z.literal('customers'),
  id: z.string().uuid(),
  attributes: customerAttributesDataSchema,
  relationships: customerRelationshipsDataSchema,
});

export type CustomerDataType = z.infer<typeof customerDataSchema>;
export type CustomerData = CustomerDataType;

export const toCustomerData = (c: Customer): CustomerDataType => ({
  type: 'customers',
  id: c.id,
  attributes: toCustomerAttributesData(c),
  relationships: toCustomerRelationshipsData(c),
});

export const CustomerData = {
  schema: customerDataSchema,
  fromEntity: toCustomerData,
  fromModel: toCustomerData,
  collect: (cs: readonly Customer[]): CustomerDataType[] => cs.map(toCustomerData),
} as const;
