import { expect, test } from "bun:test";
import { scbSettingsSchema } from "./scbSettingsForm";
import { contractSchema } from "@/schemas/createEmployeeForm/contractForm";

const settings = {
  scbPaymentSettings: {
    systemReferenceId: "TEST123",
  },
  paymentAccounts: [
    {
      id: "main",
      label: "Payroll",
      accountNumber: "0123456782",
      isPrimary: true,
    },
  ],
};

test("SCB settings save company ID and accounts without export choices", () => {
  expect(
    scbSettingsSchema.parse(settings).paymentAccounts[0].accountNumber,
  ).toBe("0123456782");
  expect(
    scbSettingsSchema.parse({
      ...settings,
      scbPaymentSettings: {
        ...settings.scbPaymentSettings,
        payrollService: "PAY",
        smartService: "SPN",
        feePayer: "OUR",
      },
    }).scbPaymentSettings,
  ).toEqual({ systemReferenceId: "TEST123" });
  for (const change of [{ systemReferenceId: "TEST|123" }])
    expect(
      scbSettingsSchema.safeParse({
        ...settings,
        scbPaymentSettings: { ...settings.scbPaymentSettings, ...change },
      }).success,
    ).toBe(false);
});

test("employee bank fields allow optional accounts and longer other-bank accounts", () => {
  const schema = contractSchema.pick({
    bankAccountNumber: true,
    bankBranchCode: true,
  });
  expect(
    schema.parse({ bankAccountNumber: "000123456789", bankBranchCode: "0012" }),
  ).toEqual({ bankAccountNumber: "000123456789", bankBranchCode: "0012" });
  expect(
    schema.safeParse({ bankAccountNumber: "", bankBranchCode: "" }).success,
  ).toBe(true);
  expect(schema.safeParse({}).success).toBe(true);
  for (const change of [
    { bankAccountNumber: "1".repeat(26) },
    { bankAccountNumber: "123abc" },
    { bankBranchCode: "123" },
    { bankBranchCode: "01|2" },
  ]) {
    expect(schema.safeParse(change).success).toBe(false);
  }
});

test("payment accounts require unique IDs, valid fields and exactly one primary", () => {
  const account = settings.paymentAccounts[0];
  for (const paymentAccounts of [
    [],
    [account, account],
    [{ ...account, isPrimary: false }],
    [account, { ...account, id: "second" }],
    [{ ...account, label: " " }],
    [{ ...account, label: "bad|name" }],
    [{ ...account, accountNumber: "123" }],
  ])
    expect(
      scbSettingsSchema.safeParse({ ...settings, paymentAccounts }).success,
    ).toBe(false);
  expect(
    scbSettingsSchema.safeParse({
      ...settings,
      paymentAccounts: [
        account,
        { ...account, id: "second", isPrimary: false },
      ],
    }).success,
  ).toBe(true);
});
