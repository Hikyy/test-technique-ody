import { z } from "zod";

export const listNotificationsFiltersDtoSchema = z.object({
  status: z.enum(["all", "unread"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListNotificationsFiltersDTOType = z.infer<typeof listNotificationsFiltersDtoSchema>;
export type ListNotificationsFiltersDTO = ListNotificationsFiltersDTOType;
export const ListNotificationsRequest = listNotificationsFiltersDtoSchema;
export const ListNotificationsFiltersDTO = {
  fromRequest: (req: ListNotificationsFiltersDTOType): ListNotificationsFiltersDTOType => req,
} as const;
