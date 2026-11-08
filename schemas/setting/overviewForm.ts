import { z } from "zod";

export const overviewSchema = z.object({
  name: z.string().max(50, "Field name cannot exceed 50 charecter"),
  taxId: z
    .string()
    .length(13, "Tax Id must be 13 digit")
    .optional()
    .or(z.literal("")),
  default_work_hours_per_day: z
    .number({ required_error: "Work hour / day is Required" })
    .min(0.01, "Work hour must be greater than 0")
    .lte(24, "Work hour must <= 24"),
  default_workdays_per_month: z
    .number({ required_error: "Work day / month is Required" })
    .min(0.01, "Work day must be greater than 0")
    .lte(31, "Work day must <= 31"),
});
