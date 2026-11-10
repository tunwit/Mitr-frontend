import { addressSchema } from "@/schemas/createEmployeeForm/addressForm";
import { contractSchema } from "@/schemas/createEmployeeForm/contractForm";
import {
  personalSchema,
  personalWithAvatarSchema,
} from "@/schemas/createEmployeeForm/personalForm";
import { z } from "zod";

export const createEmployeeFormSchema = personalWithAvatarSchema
  .merge(addressSchema)
  .merge(contractSchema);
export type createEmployeeFormField = z.infer<typeof createEmployeeFormSchema>;

export const updateEmployeeFormSchema = personalSchema
  .merge(addressSchema)
  .merge(contractSchema)
  .partial({ dateOfBirth: true, position: true });
export type updateEmployeeFormField = z.infer<typeof updateEmployeeFormSchema>;
