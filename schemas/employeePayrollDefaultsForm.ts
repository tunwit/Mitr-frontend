import { z } from "zod";

export const employeePayrollDefaultsSchema = (invalidAmount: string) =>
  z.object({
    amounts: z.record(z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, invalidAmount)),
  });
