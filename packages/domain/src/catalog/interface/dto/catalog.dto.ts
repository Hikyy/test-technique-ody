import { z } from "zod";

const imageUrlSchema = z
  .string()
  .min(1)
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), {
    message: 'image_url must be an absolute URL or a relative path starting with "/"',
  });

export const createDishDtoSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullish(),
  price_cents: z.number().int().nonnegative(),
  available: z.boolean().default(true),
  image_url: imageUrlSchema.nullish(),
});
export type CreateDishDTOType = z.infer<typeof createDishDtoSchema>;
export type CreateDishDTO = CreateDishDTOType;
export const CreateDishRequest = createDishDtoSchema;
export const CreateDishDTO = {
  fromRequest: (req: CreateDishDTOType): CreateDishDTOType => req,
} as const;

export const updateDishDtoSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullish(),
  price_cents: z.number().int().nonnegative().optional(),
  available: z.boolean().optional(),
  image_url: imageUrlSchema.nullish(),
});
export type UpdateDishDTOType = z.infer<typeof updateDishDtoSchema>;
export type UpdateDishDTO = UpdateDishDTOType;
export const UpdateDishRequest = updateDishDtoSchema;
export const UpdateDishDTO = {
  fromRequest: (req: UpdateDishDTOType): UpdateDishDTOType => req,
} as const;

export const createCategoryDtoSchema = z.object({
  name: z.string().min(1).max(80),
  position: z.number().int().min(0).max(999).optional(),
});
export type CreateCategoryDTOType = z.infer<typeof createCategoryDtoSchema>;
export type CreateCategoryDTO = CreateCategoryDTOType;
export const CreateCategoryRequest = createCategoryDtoSchema;
export const CreateCategoryDTO = {
  fromRequest: (req: CreateCategoryDTOType): CreateCategoryDTOType => req,
} as const;

export const listDishesFiltersDtoSchema = z.object({
  category_id: z.string().uuid().optional(),
  available: z.boolean().optional(),
  search: z.string().trim().min(1).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type ListDishesFiltersDTOType = z.infer<typeof listDishesFiltersDtoSchema>;
export type ListDishesFiltersDTO = ListDishesFiltersDTOType;
export const ListDishesRequest = listDishesFiltersDtoSchema;
export const ListDishesFiltersDTO = {
  fromRequest: (req: ListDishesFiltersDTOType): ListDishesFiltersDTOType => req,
} as const;
