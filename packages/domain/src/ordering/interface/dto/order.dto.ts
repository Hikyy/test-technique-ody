import { z } from "zod";
import { orderStatusSchema } from "../data/order.data.js";

export const createOrderLineDtoSchema = z.object({
  dish_id: z.string().uuid(),
  qty: z.number().int().min(1).max(99),
  unit_price_cents: z.number().int().nonnegative(),
  notes: z.string().max(500).nullish(),
});
export type CreateOrderLineDTO = z.infer<typeof createOrderLineDtoSchema>;

export const createOrderDtoSchema = z.object({
  table_number: z.number().int().min(1).max(99),
  table_id: z.string().uuid().nullish(),
  reservation_id: z.string().uuid().nullish(),
  customer_id: z.string().uuid().nullish(),
  scheduled_at: z.string().datetime(),
  lines: z.array(createOrderLineDtoSchema).min(1),
  notes: z.string().max(2000).nullish(),
});
export type CreateOrderDTOType = z.infer<typeof createOrderDtoSchema>;
export type CreateOrderDTO = CreateOrderDTOType;
export const CreateOrderRequest = createOrderDtoSchema;
export const CreateOrderDTO = {
  fromRequest: (req: CreateOrderDTOType): CreateOrderDTOType => req,
} as const;

export const changeOrderStatusDtoSchema = z.object({
  status: orderStatusSchema,
});
export type ChangeOrderStatusDTOType = z.infer<typeof changeOrderStatusDtoSchema>;
export type ChangeOrderStatusDTO = ChangeOrderStatusDTOType;
export const ChangeOrderStatusRequest = changeOrderStatusDtoSchema;
export const ChangeOrderStatusDTO = {
  fromRequest: (req: ChangeOrderStatusDTOType): ChangeOrderStatusDTOType => req,
} as const;

export const orderSearchScopeSchema = z.enum(["table", "dish", "notes"]).default("table");
export type OrderSearchScope = z.infer<typeof orderSearchScopeSchema>;

export const listOrdersFiltersDtoSchema = z.object({
  status: orderStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().trim().min(1).max(120).optional(),
  search_scope: orderSearchScopeSchema,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type ListOrdersFiltersDTOType = z.infer<typeof listOrdersFiltersDtoSchema>;
export type ListOrdersFiltersDTO = ListOrdersFiltersDTOType;
export const ListOrdersRequest = listOrdersFiltersDtoSchema;
export const ListOrdersFiltersDTO = {
  fromRequest: (req: ListOrdersFiltersDTOType): ListOrdersFiltersDTOType => req,
} as const;
