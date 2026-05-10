import { z } from "zod";
import { weekScheduleSchema } from "../data/settings.data.js";

export const updateSettingsDtoSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  address: z.string().min(1).max(240).optional(),
  phone: z.string().nullish(),
  contact_email: z.string().email().nullish(),
  opening_hours: weekScheduleSchema.optional(),
  notifications_enabled: z.boolean().optional(),
});
export type UpdateSettingsDTOType = z.infer<typeof updateSettingsDtoSchema>;
export type UpdateSettingsDTO = UpdateSettingsDTOType;
export const UpdateSettingsRequest = updateSettingsDtoSchema;
export const UpdateSettingsDTO = {
  fromRequest: (req: UpdateSettingsDTOType): UpdateSettingsDTOType => req,
} as const;
