import { NativeInput } from "@/widget/Input";
import { moneyFormat } from "@/utils/formmatter";
import { Checkbox, Table } from "@mui/joy";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";
import React, { Dispatch, SetStateAction, useEffect } from "react";

interface PayrollTableProps<T extends { id: number }> {
  data: T[];
  renderName: (item: T) => string;
  renderAmount: (item: T) => number;
  showIncomeRow?: boolean;
  salary?: string;
  showValueColumn?: boolean; // show hours/units column
  autoCalculate?: boolean; // disable amount input & auto calc
  calculateAmount?: (item: T, value: number) => number;
  amountValues: Record<number, { amount: number; value?: number }>;
  setInputValues: Dispatch<
    SetStateAction<Record<number, { amount: number; value?: number }>>
  >;
  setIsDirty: Dispatch<SetStateAction<boolean>>;
  baseSalary?: Decimal;
  setBaseSalary?: Dispatch<SetStateAction<Decimal>>;
  showFooter?: boolean;
}

export default function PayrollTable<T extends { id: number }>({
  data,
  renderName,
  renderAmount,
  showIncomeRow = false,
  salary,
  showValueColumn = false,
  autoCalculate = false,
  calculateAmount,
  amountValues,
  setInputValues,
  setIsDirty,
  baseSalary,
  setBaseSalary,
  showFooter = true,
}: PayrollTableProps<T>) {
  const t = useTranslations("record.edit");
  const tr = useTranslations("record");

  const updateValue = (id: number, val: number) => {
    setInputValues((prev) => ({
      ...prev,
      [id]: {
        value: prev[id]?.value ?? undefined,
        amount: val,
      },
    }));
    setIsDirty(true);
  };

  const sum = data.reduce(
    (acc, item) =>
      acc.plus(amountValues[item.id]?.amount ?? renderAmount(item)),
    new Decimal(0),
  );
  const total = showIncomeRow ? sum.plus(baseSalary ?? 0) : sum;

  const isInitialized = React.useRef(false);

  useEffect(() => {
    if (!autoCalculate || !calculateAmount || !data) return;

    setInputValues((prev) => {
      const updated = { ...prev };
      let changed = false;

      data.forEach((item: any) => {
        const value = prev[item.id]?.value ?? item.value ?? 0;
        const newAmount = calculateAmount(item, value);

        if (!prev[item.id] || prev[item.id].amount !== newAmount) {
          updated[item.id] = { value, amount: newAmount };
          changed = true;
        }
      });

      return changed ? updated : prev;
    });

    isInitialized.current = true;
  }, [data]);

  const applyAutoAmount = (item: any, v: number) => {
    if (!autoCalculate || !calculateAmount) return;

    const newAmount = calculateAmount(item, v);
    setInputValues((prev) => ({
      ...prev,
      [item.id]: {
        value: v,
        amount: newAmount,
      },
    }));
    setIsDirty(true);
  };

  useEffect(() => {
    if (!autoCalculate || !calculateAmount || !data) return;
    if (!isInitialized.current) return; // skip until initialized

    setInputValues((prev) => {
      const updated = { ...prev };
      let changed = false;

      data.forEach((item: any) => {
        const value = prev[item.id]?.value ?? item.value ?? 0;
        const newAmount = calculateAmount(item, value);

        if (prev[item.id]?.amount !== newAmount) {
          updated[item.id] = { value, amount: newAmount };
          changed = true;
        }
      });

      if (changed) setIsDirty(true); // only dirty on actual recalc
      return changed ? updated : prev;
    });
  }, [baseSalary]);

  return (
    <div className="overflow-auto max-h-[calc(100vh-350px)]">
      <Table stickyHeader stickyFooter>
        <thead>
          <tr>
            <th className="w-8 lg:w-[5%] "></th>
            <th>{t("fields.title")}</th>
            {showValueColumn && <th>{t("fields.value")}</th>}
            <th>{t("fields.amount")}</th>
          </tr>
        </thead>

        <tbody>
          {showIncomeRow && (
            <tr key={-1}>
              <td>
                <Checkbox checked={true} />
              </td>

              <td>{tr("fields.base_salary")}</td>

              {/* Amount */}
              <td>
                <NativeInput
                  appearance="table"
                  type="number"
                  value={baseSalary?.toNumber()}
                  onChange={(e) => {
                    setBaseSalary
                      ? setBaseSalary(new Decimal(e.target.value || 0))
                      : {};
                    setIsDirty(true);
                  }}
                  placeholder="0"
                />
              </td>
            </tr>
          )}

          {data.map((item: any) => {
            const record = amountValues[item.id];
            const value = record?.value ?? item.value;
            const amount = record?.amount ?? renderAmount(item);

            return (
              <tr key={item.id}>
                <td>
                  <Checkbox checked={true} />
                </td>

                <td>{renderName(item)}</td>

                {/* Value Column */}
                {showValueColumn && (
                  <td>
                    <NativeInput
                      appearance="table"
                      type="number"
                      value={value}
                      onChange={(e) => {
                        applyAutoAmount(item, Number(e.target.value));
                      }}
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Amount */}
                <td>
                  <NativeInput
                    appearance="table"
                    type="number"
                    value={amount}
                    readOnly={autoCalculate}
                    onChange={(e) => {
                      if (!autoCalculate)
                        updateValue(item.id, Number(e.target.value));
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot hidden={!showFooter}>
          <tr>
            <th colSpan={showValueColumn ? 3 : 2}>{t("fields.total")}</th>
            <th>{moneyFormat(total || 0)}</th>
          </tr>
        </tfoot>
      </Table>
    </div>
  );
}
