import { expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/locales/UI/en.json";
import { payrollSettingForm } from "@/schemas/payroll/settingForm";
import { overviewSchema } from "@/schemas/setting/overviewForm";
import PayrollTable from "./PayrollTable";

for (const [changes, showIncomeRow, expected] of [
  [{}, false, "1,500.00"],
  [{ first: "1200" }, false, "1,700.00"],
  [{ first: "0" }, false, "500.00"],
  [{ first: "1200" }, true, "23,700.00"],
  [{ first: "" }, false, "500.00"],
] as const) {
  test(`table subtotal includes saved rows and edits: ${expected}`, () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="Asia/Bangkok">
        <PayrollTable
          data={[{ code: "first", amount: "1000" }, { code: "second", amount: "500" }, { code: "new", amount: "" }]}
          renderName={() => "Earning"}
          renderInput={(row) => row.amount}
          changes={changes}
          onChange={() => {}}
          salary={showIncomeRow ? { value: "22000", onChange: () => {} } : undefined}
        />
      </NextIntlClientProvider>,
    );
    expect(html.match(/<tfoot[\s\S]*?<\/tfoot>/)?.[0]).toContain(expected);
  });
}

test("both settings forms reject zero working hours and days", () => {
  for (const [hours, days] of [[0, 22], [8, 0], [-1, 22]]) {
    expect(payrollSettingForm.safeParse({ work_hour_per_day: hours, work_day_per_month: days }).success).toBe(false);
    expect(overviewSchema.safeParse({ name: "Shop", default_work_hours_per_day: hours, default_workdays_per_month: days }).success).toBe(false);
  }
  expect(payrollSettingForm.safeParse({ work_hour_per_day: 8, work_day_per_month: 22 }).success).toBe(true);
});
