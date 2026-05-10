import { z } from "zod";

export const createCustomerDtoSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  email: z.string().email().nullish(),
  phone: z.string().nullish(),
  notes: z.string().max(2000).nullish(),
});
export type CreateCustomerDTOType = z.infer<typeof createCustomerDtoSchema>;
export type CreateCustomerDTO = CreateCustomerDTOType;
export const CreateCustomerRequest = createCustomerDtoSchema;
export const CreateCustomerDTO = {
  fromRequest: (req: CreateCustomerDTOType): CreateCustomerDTOType => req,
} as const;

export const updateCustomerDtoSchema = createCustomerDtoSchema.partial();
export type UpdateCustomerDTOType = z.infer<typeof updateCustomerDtoSchema>;
export type UpdateCustomerDTO = UpdateCustomerDTOType;
export const UpdateCustomerRequest = updateCustomerDtoSchema;
export const UpdateCustomerDTO = {
  fromRequest: (req: UpdateCustomerDTOType): UpdateCustomerDTOType => req,
} as const;

export const customerSearchScopeSchema = z.enum(["name", "email", "phone"]).default("name");
export type CustomerSearchScope = z.infer<typeof customerSearchScopeSchema>;

export const listCustomersFiltersDtoSchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  search_scope: customerSearchScopeSchema,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type ListCustomersFiltersDTOType = z.infer<typeof listCustomersFiltersDtoSchema>;
export type ListCustomersFiltersDTO = ListCustomersFiltersDTOType;
export const ListCustomersRequest = listCustomersFiltersDtoSchema;
export const ListCustomersFiltersDTO = {
  fromRequest: (req: ListCustomersFiltersDTOType): ListCustomersFiltersDTOType => req,
} as const;
