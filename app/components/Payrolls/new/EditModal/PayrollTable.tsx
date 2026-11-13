import { NativeInput } from "@/widget/Input";
import { moneyFormat } from "@/utils/formmatter";
import { Checkbox, Table } from "@mui/joy";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";

interface PayrollTableProps<Row extends { code: string }> {
  data: Row[];
  renderName: (item: Row) => string;
  renderInput: (item: Row) => string;
  changes: Record<string, string>;
  onChange: (code: string, value: string) => void;
  disabled?: boolean;
  calculateAmount?: (item: Row, value: number) => number;
  salary?: { value: string; onChange: (value: string) => void };
  showFooter?: boolean;
}

export default function PayrollTable<Row extends { code: string }>({
  data,
  renderName,
  renderInput,
  changes,
  onChange,
  disabled = false,
  calculateAmount,
  salary,
  showFooter = true,
}: PayrollTableProps<Row>) {
  const t = useTranslations("record.edit");
  const tr = useTranslations("record");
  const rows = data.map((item) => {
    const input = changes[item.code] ?? renderInput(item);
    const value = Number(input);
    const amount = input && Number.isFinite(value)
      ? (calculateAmount ? calculateAmount(item, value) : input)
      : "";
    return { item, input, amount };
  });
  const total = rows.reduce(
    (sum, { amount }) => sum.plus(Number.isFinite(Number(amount)) ? amount || 0 : 0),
    new Decimal(salary?.value || 0),
  );

  return (
    <div className="overflow-auto max-h-[calc(100vh-350px)]">
      <Table stickyHeader stickyFooter>
        <thead>
          <tr>
            <th className="w-8 lg:w-[5%]" />
            <th>{t("fields.title")}</th>
            {calculateAmount && <th>{t("fields.value")}</th>}
            <th>{t("fields.amount")}</th>
          </tr>
        </thead>
        <tbody>
          {salary && (
            <tr>
              <td><Checkbox checked /></td>
              <td>{tr("fields.base_salary")}</td>
              <td>
                <NativeInput
                  aria-label={tr("fields.base_salary")}
                  appearance="table"
                  type="number"
                  value={salary.value}
                  disabled={disabled}
                  onChange={(event) => salary.onChange(event.target.value)}
                />
              </td>
            </tr>
          )}
          {rows.map(({ item, input, amount }) => (
            <tr key={item.code}>
              <td><Checkbox checked={input !== ""} disabled /></td>
              <td>{renderName(item)}</td>
              <td>
                <NativeInput
                  aria-label={renderName(item)}
                  appearance="table"
                  type="number"
                  value={input}
                  disabled={disabled}
                  onChange={(event) => onChange(item.code, event.target.value)}
                />
              </td>
              {calculateAmount && (
                <td>
                  <NativeInput appearance="table" type="number" value={amount} readOnly />
                </td>
              )}
            </tr>
          ))}
        </tbody>
        {showFooter && (
          <tfoot>
            <tr>
              <th colSpan={calculateAmount ? 3 : 2}>{t("fields.total")}</th>
              <th>{moneyFormat(total)}</th>
            </tr>
          </tfoot>
        )}
      </Table>
    </div>
  );
}
