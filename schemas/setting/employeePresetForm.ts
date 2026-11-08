import { z } from "zod";

export const employeePresetSchema = (messages: {
  nameRequired: string;
  nameTooLong: string;
}) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, messages.nameRequired)
      .max(100, messages.nameTooLong),
    employeeIds: z
      .array(z.number().int().positive())
      .refine((ids) => new Set(ids).size === ids.length),
  });
