import { expect, mock, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/locales/UI/en.json";
import { EmployeePayrollDefaultsDTO } from "@/types/type.employee";

let items: EmployeePayrollDefaultsDTO["items"] = [];
mock.module("@/hooks/shop/useCurrentShop", () => ({
  useCurrentShop: () => ({ id: 10 }),
}));
mock.module("@/hooks/payroll/fields/hook.compensation", () => ({
  useCompensationField: (type: string) => ({
    isPending: false,
    isError: false,
    data: {
      data:
        type === "INCOME"
          ? [
              { id: 1, name: "Allowance", nameEng: "Allowance" },
              { id: 2, name: "Bonus", nameEng: "Bonus" },
            ]
          : [{ id: 101, name: "Deduction", nameEng: "Deduction" }],
    },
  }),
}));
mock.module("@/hooks/hook.employeePayrollDefaults", () => ({
  useEmployeePayrollDefaults: () => ({
    list: { isPending: false, isError: false, data: { data: { items } } },
    save: { isPending: false },
  }),
}));
const { default: EmployeePayrollDefaults } = await import(
  "./EmployeePayrollDefaults"
);

test("only configured fields are shown, including explicitly saved zero amounts", () => {
  items = [
    { fieldId: 1, amount: "0.00" },
    { fieldId: 101, amount: "250.50" },
  ];
  const html = renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
      timeZone="Asia/Bangkok"
    >
      <EmployeePayrollDefaults employeeId={5} enabled />
    </NextIntlClientProvider>,
  );
  expect(html).toContain('name="amounts.1"');
  expect(html).toContain('name="amounts.101"');
  expect(html).not.toContain('name="amounts.2"');
  expect(html).toContain('value="0.00"');
  expect(html).toContain('aria-label="Remove Allowance"');
  expect(html).toContain('aria-label="Add field to Earnings"');
});

test("employees without configured defaults start with no amount inputs", () => {
  items = [];
  const html = renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
      timeZone="Asia/Bangkok"
    >
      <EmployeePayrollDefaults employeeId={6} enabled />
    </NextIntlClientProvider>,
  );
  expect(html).not.toContain('name="amounts.');
  expect(html).toContain("No defaults configured.");
});
