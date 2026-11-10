import type { EntryBreakDownDTO } from "@/types/type.entry";
import { moneyFormat } from "@/utils/formmatter";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";
import React from "react";

export function getPayrollSummaryTotals(breakdowns: readonly EntryBreakDownDTO[]) {
  const zero = new Decimal(0);
  return breakdowns.reduce(
    (totals, { entry, calculation }) => ({
      totalSalary: totals.totalSalary.plus(entry.salary),
      totalEarning: totals.totalEarning
        .plus(calculation.totals.earnings)
        .plus(calculation.totals.overtime),
      totalDeduction: totals.totalDeduction.plus(calculation.summary.adjustment),
      totalNet: totals.totalNet.plus(calculation.netPay),
    }),
    { totalSalary: zero, totalEarning: zero, totalDeduction: zero, totalNet: zero },
  );
}

export default function SummarySection({
  breakdowns,
}: {
  breakdowns: readonly EntryBreakDownDTO[];
}) {
  const t = useTranslations("summary_period");
  const tPeriod = useTranslations("period");
  const { totalSalary, totalEarning, totalDeduction, totalNet } =
    getPayrollSummaryTotals(breakdowns);
  return (
    <div className="bg-white rounded-lg border border-gray-200 mt-6 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("info.summary")}
      </h2>
      <div className="grid grid-cols-4 gap-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            {tPeriod("fields.total_base_salary")}
          </p>
          <p className="text-xl font-bold text-gray-900">
            ฿ {moneyFormat(totalSalary)}
          </p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700 mb-2">
            {tPeriod("fields.total_earning")}
          </p>
          <p className="text-xl font-bold text-green-900">
            ฿ {moneyFormat(totalEarning)}
          </p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700 mb-2">
            {tPeriod("fields.total_deduction")}
          </p>
          <p className="text-xl font-bold text-red-900">
            ฿ {moneyFormat(totalDeduction)}
          </p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <p className="text-sm text-blue-700 mb-2 uppercase font-semibold">
            {tPeriod("fields.grand_total")}
          </p>
          <p className="text-2xl font-bold text-blue-900">
            ฿ {moneyFormat(totalNet)}
          </p>
        </div>
      </div>
    </div>
  );
}
