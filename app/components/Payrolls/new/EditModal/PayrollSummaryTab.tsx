import { useEntryBreakdown } from "@/hooks/payroll/entry/hook.entry";
import { moneyFormat, toNumberIfWhole } from "@/utils/formmatter";
import { Table } from "@mui/joy";
import { useTranslations } from "next-intl";

interface PayrollSummaryTabProps {
  periodId: number;
  entryId: number;
}

const translateOT = {
  DAILY: "day",
  HOURLY: "hour",
};

const translatePenalty = {
  DAILY: "day",
  HOURLY: "hour",
  PER_MINUTE: "minute",
};

export default function PayrollSummaryTab({
  periodId,
  entryId,
}: PayrollSummaryTabProps) {
  const { data: breakdownData } = useEntryBreakdown(periodId, entryId).get;
  const t = useTranslations("record");
  const tc = useTranslations("common");
  const breakdown = breakdownData?.data;
  if (!breakdown) return <p>Loading...</p>;
  return (
    <>
      <Table borderAxis="both">
        <thead>
          <tr>
            <th className="w-[45%]">{t("fields.title")}</th>
            <th>{t("fields.earning")}</th>
            <th>{t("fields.deduction")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium">{t("fields.base_salary")}</td>
            <td>{moneyFormat(breakdown.entry.salary)}</td>
            <td></td>
          </tr>
          {breakdown.items.earnings.map((salary) => (
            <tr key={salary.id}>
              <td className="font-medium">{salary.name}</td>
              <td>{moneyFormat(salary.amount)}</td>
              <td></td>
            </tr>
          ))}
          {breakdown.items.deductions.map((salary) => (
            <tr key={salary.id}>
              <td className="font-medium">{salary.name}</td>
              <td></td>
              <td>{moneyFormat(salary.amount)}</td>
            </tr>
          ))}
          {breakdown.items.ots.map((ot) => (
            <tr key={ot.id}>
              <td className="font-medium">{ot.name}</td>
              <td>
                {moneyFormat(ot.amount)} (
                {tc(`unit.${translateOT[ot.method]}`, {
                  count: toNumberIfWhole(ot.value),
                })}
                )
              </td>
              <td></td>
            </tr>
          ))}
          {breakdown.items.penalties.map((penalty) => (
            <tr key={penalty.id}>
              <td className="font-medium">{penalty.name}</td>
              <td></td>
              <td>
                {moneyFormat(penalty.amount)} (
                {tc(`unit.${translatePenalty[penalty.method]}`, {
                  count: toNumberIfWhole(penalty.value),
                })}
                )
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-3 px-4 font-semibold text-gray-700">
              {t("fields.total")}
            </td>
            <td className="py-3 px-4 font-semibold text-gray-900">
              {moneyFormat(breakdown.calculation.summary.gross || 0)} ฿
            </td>
            <td className="py-3 px-4 font-semibold text-gray-900">
              {moneyFormat(breakdown.calculation.summary.adjustment || 0)} ฿
            </td>
          </tr>
          <tr className="bg-gray-50">
            <td className="py-3 px-4 font-bold text-lg text-gray-700">
              {t("fields.net")}
            </td>
            <td
              colSpan={2}
              className="py-3 px-4 font-bold text-lg text-gray-900"
            >
              {moneyFormat(breakdown.calculation.netPay || 0)} ฿
            </td>
          </tr>
        </tfoot>
      </Table>
      {breakdown.items.non_calculated.length > 0 && (
        <Table aria-label={t("edit.tabs.display_only")} borderAxis="both" sx={{ mt: 2 }}>
          <thead>
            <tr>
              <th>{t("edit.tabs.display_only")}</th>
              <th>{t("edit.fields.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.items.non_calculated.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{moneyFormat(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
