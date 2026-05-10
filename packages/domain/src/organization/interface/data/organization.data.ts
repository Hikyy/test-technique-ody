import { z } from "zod";

export const organizationAttributesSchema = z.object({
  name: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const organizationDataSchema = z.object({
  type: z.literal("organizations"),
  id: z.string().uuid(),
  attributes: organizationAttributesSchema,
});

export type OrganizationData = z.infer<typeof organizationDataSchema>;

export interface OrganizationModel {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
  updatedAt: Date;
}

const toOrganizationData = (m: OrganizationModel): OrganizationData => ({
  type: "organizations",
  id: m.id,
  attributes: {
    name: m.name,
    role: m.role,
    created_at: m.createdAt.toISOString(),
    updated_at: m.updatedAt.toISOString(),
  },
});

export const OrganizationData = {
  schema: organizationDataSchema,
  fromModel: toOrganizationData,
  collect: (xs: OrganizationModel[]): OrganizationData[] => xs.map(toOrganizationData),
} as const;

export const restaurantInOrgAttributesSchema = z.object({
  name: z.string(),
  created_at: z.string().datetime(),
});

export const restaurantInOrgDataSchema = z.object({
  type: z.literal("restaurants"),
  id: z.string().uuid(),
  attributes: restaurantInOrgAttributesSchema,
  relationships: z.object({
    organization: z.object({ data: z.object({ type: z.literal("organizations"), id: z.string() }) }),
  }),
});

export type RestaurantInOrgData = z.infer<typeof restaurantInOrgDataSchema>;

export interface RestaurantInOrgModel {
  id: string;
  organizationId: string;
  name: string;
  createdAt: Date;
}

const toRestaurantInOrgData = (m: RestaurantInOrgModel): RestaurantInOrgData => ({
  type: "restaurants",
  id: m.id,
  attributes: {
    name: m.name,
    created_at: m.createdAt.toISOString(),
  },
  relationships: {
    organization: { data: { type: "organizations", id: m.organizationId } },
  },
});

export const RestaurantInOrgData = {
  schema: restaurantInOrgDataSchema,
  fromModel: toRestaurantInOrgData,
  collect: (xs: RestaurantInOrgModel[]): RestaurantInOrgData[] => xs.map(toRestaurantInOrgData),
} as const;
