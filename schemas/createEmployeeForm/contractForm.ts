import { EMPLOYEE_STATUS } from "@/types/enum/enum";
import { SALARY_PAYMENT_METHODS } from "@/types/enum/enum.employee";
import { z } from "zod";

export const contractSchema = z.object({
  salary: z
    .number({ required_error: "Salary is Required" })
    .gte(0, "Salary must >= 0"),
  position: z.string().min(1, "Position is required"),
  dateEmploy: z.date({ required_error: "Employ date is required" }).optional(),
  preferredPaymentMethod: z.enum(SALARY_PAYMENT_METHODS).nullable().optional(),
  haveSocialSecurity: z.boolean(),
  socialSecurityNumber: z.string().trim().max(64).optional(),
  bankName: z.string().trim().optional().or(z.literal("")),
  bankAccountNumber: z
    .string()
    .trim()
    .min(1, "Account number is required").max(25, "Account number must not exceed 25 digits")
    .regex(/^\d+$/, "Account number must contain only numbers")
    .optional()
    .or(z.literal("")),
  bankBranchCode: z.string().trim().regex(/^\d{4}$/, "Branch code must be exactly 4 digits").optional().or(z.literal("")),
  bankAccountOwner: z
    .string()
    .trim()
    .min(1, "Owner name is required")
    .optional()
    .or(z.literal("")),
  promtpay: z.string().trim().optional(),
  branchId: z.number({ required_error: "Branch is required" }),
  status: z.nativeEnum(EMPLOYEE_STATUS),
});
