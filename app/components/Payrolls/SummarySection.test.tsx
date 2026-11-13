import { expect, test } from "bun:test";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import messages from "@/locales/UI/th.json";
import type { EntryBreakDownDTO } from "@/types/type.entry";
import SummarySection, { getPayrollSummaryTotals } from "./SummarySection";

const salaryOnly: EntryBreakDownDTO = {
  entry: {
    id: 1,
    salary: "15837.00",
    note: null,
    employee: {
      id: 1,
      email: "",
      snapshot: {
        firstName: "Example",
        lastName: "Employee",
        nickName: "",
        branch: { id: 1, name: "Example", nameEng: "Example" },
      },
    },
    payslipSent: false,
    paidAt: null,
  },
  currentPreferredPaymentMethod: null,
  currentSocialSecurityCoverage: null,
  items: { earnings: [], deductions: [], ots: [], penalties: [], non_calculated: [] },
  calculation: {
    totals: { earnings: 0, deductions: 0, overtime: 0, penalties: 0 },
    summary: { gross: 15837, adjustment: 0 },
    netPay: 15837,
  },
};

test("salary-only payroll shows the saved base salary and zero additional earnings", () => {
  const html = renderToStaticMarkup(
    <NextIntlClientProvider locale="th" messages={messages} timeZone="Asia/Bangkok">
      <SummarySection breakdowns={[salaryOnly]} />
    </NextIntlClientProvider>,
  );
  expect(html.match(/฿ [\d,.]+/g)).toEqual([
    "฿ 15,837.00",
    "฿ 0.00",
    "฿ 0.00",
    "฿ 15,837.00",
  ]);
});

test("payroll summary includes overtime and penalties while preserving cents", () => {
  const withAdjustments: EntryBreakDownDTO = {
    ...salaryOnly,
    entry: { ...salaryOnly.entry, id: 2, salary: "1000.01" },
    calculation: {
      totals: { earnings: 200.02, deductions: 20.04, overtime: 50.03, penalties: 5.05 },
      summary: { gross: 1250.06, adjustment: 25.09 },
      netPay: 1224.97,
    },
  };
  const totals = getPayrollSummaryTotals([salaryOnly, withAdjustments]);
  expect(totals.totalSalary.toFixed(2)).toBe("16837.01");
  expect(totals.totalEarning.toFixed(2)).toBe("250.05");
  expect(totals.totalDeduction.toFixed(2)).toBe("25.09");
  expect(totals.totalNet.toFixed(2)).toBe("17061.97");
});
