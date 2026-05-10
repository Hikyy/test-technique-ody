import { z } from "zod";

export const createOrganizationDtoSchema = z.object({
  name: z.string().min(1).max(120),
});
export type CreateOrganizationDTOType = z.infer<typeof createOrganizationDtoSchema>;
export type CreateOrganizationDTO = CreateOrganizationDTOType;
export const CreateOrganizationRequest = createOrganizationDtoSchema;
export const CreateOrganizationDTO = {
  fromRequest: (req: CreateOrganizationDTOType): CreateOrganizationDTOType => req,
} as const;

export const createRestaurantInOrgDtoSchema = z.object({
  name: z.string().min(1).max(120),
});
export type CreateRestaurantInOrgDTOType = z.infer<typeof createRestaurantInOrgDtoSchema>;
export type CreateRestaurantInOrgDTO = CreateRestaurantInOrgDTOType;
export const CreateRestaurantInOrgRequest = createRestaurantInOrgDtoSchema;
export const CreateRestaurantInOrgDTO = {
  fromRequest: (req: CreateRestaurantInOrgDTOType): CreateRestaurantInOrgDTOType => req,
} as const;
