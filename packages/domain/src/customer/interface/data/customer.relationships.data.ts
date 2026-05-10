import { z } from "zod";
import type { Customer } from "../../domain/entities/customer.js";

export const customerRelationshipsDataSchema = z.object({}).strict();

export type CustomerRelationshipsData = z.infer<typeof customerRelationshipsDataSchema>;

export const toCustomerRelationshipsData = (_c: Customer): CustomerRelationshipsData => ({});
