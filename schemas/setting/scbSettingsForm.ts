import { z } from "zod";

export const scbSettingsSchema = z.object({
  scbPaymentSettings: z.object({
    systemReferenceId: z
      .string()
      .trim()
      .regex(/^[^\s!"#$%&*+;<=>?@[\]\\^_`{|}~]{1,18}$/, "SYSTEM_REFERENCE"),
  }),
  paymentAccounts: z
    .array(
      z.object({
        id: z.string().regex(/^[a-zA-Z0-9-]{1,64}$/, "FUNDING_ACCOUNT"),
        label: z
          .string()
          .trim()
          .min(1, "FUNDING_ACCOUNT")
          .max(80, "FUNDING_ACCOUNT")
          .regex(/^[^|\r\n]+$/, "FUNDING_ACCOUNT"),
        accountNumber: z
          .string()
          .trim()
          .regex(/^\d{10}$/, "DEBIT_ACCOUNT"),
        isPrimary: z.boolean(),
      }),
    )
    .min(1, "FUNDING_ACCOUNT")
    .max(42, "FUNDING_ACCOUNT")
    .refine(
      (accounts) =>
        new Set(accounts.map((account) => account.id)).size ===
          accounts.length &&
        accounts.filter((account) => account.isPrimary).length === 1,
      "FUNDING_ACCOUNT",
    ),
});
export type ScbSettingsFormValues = z.infer<typeof scbSettingsSchema>;
