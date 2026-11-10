import { NativeInput } from "@/widget/Input";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useLocale, useTranslations } from "next-intl";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { PeriodFilterContextDTO } from "@/types/type.period";
import { EntryBreakDownDTO } from "@/types/type.entry";
import { getLocalizedName } from "@/lib/getLocalizedName";

/* ---------------- TYPES ---------------- */

type NumberOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
type BooleanField = "paid" | "currentSocialSecurityCoverage";

type FilterRule =
  | {
      id: string;
      type: "number";
      field: string;
      operator: NumberOperator;
      value: number;
    }
  | {
      id: string;
      type: "boolean";
      field: BooleanField;
      operator: "eq" | "neq";
      value: boolean;
    };

type FieldOption = {
  id: string;
  name: string;
  nameEng: string;
};

/* ---------------- CONSTANTS ---------------- */

const numberOperators: NumberOperator[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
];
const booleanOperators = ["eq", "neq"] as const;

const isBooleanField = (field: string): field is BooleanField =>
  field === "paid" || field === "currentSocialSecurityCoverage";

const numberOperatorsSymbol: Record<string, string> = {
  eq: "=",
  neq: "≠",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
};

const quickFilters = [
  {
    label: "has_overtime",
    filter: { type: "number", field: "totalOT", operator: "gt", value: 0 },
  },
  {
    label: "has_penalty",
    filter: { type: "number", field: "totalPenalty", operator: "gt", value: 0 },
  },
  {
    label: "no_deduction",
    filter: {
      type: "number",
      field: "totalDeduction",
      operator: "eq",
      value: 0,
    },
  },
  {
    label: "high_earners",
    filter: { type: "number", field: "net", operator: "gt", value: 20000 },
  },
  {
    label: "low_earners",
    filter: { type: "number", field: "net", operator: "lt", value: 16000 },
  },
  {
    label: "paid",
    filter: { type: "boolean", field: "paid", operator: "eq", value: true },
  },
  {
    label: "has_social_security",
    filter: {
      type: "boolean",
      field: "currentSocialSecurityCoverage",
      operator: "eq",
      value: true,
    },
  },
] as const;

/* ---------------- HELPERS ---------------- */

const buildValueMap = (entry: EntryBreakDownDTO) => {
  const map: Record<string, number | boolean> = {};

  Object.entries(entry.calculation.totals).forEach(([k, v]) => {
    map[k] = v;
  });

  entry.items.earnings.forEach((f) => {
    map[f.nameEng] = Number(f.amount);
  });

  entry.items.deductions.forEach((f) => {
    map[f.nameEng] = Number(f.amount);
  });

  entry.items.ots.forEach((f) => {
    map[f.nameEng] = Number(f.amount);
  });

  entry.items.penalties.forEach((f) => {
    map[f.nameEng] = Number(f.amount);
  });

  entry.items.non_calculated.forEach((f) => {
    map[f.nameEng] = Number(f.amount);
  });

  // computed
  map["totalOT"] = entry.calculation.totals.overtime;
  map["totalPenalty"] = entry.calculation.totals.penalties;
  map["totalDeduction"] = entry.calculation.summary.adjustment;
  map["net"] = entry.calculation.netPay;
  map["paid"] = entry.entry.paidAt !== null;
  if (typeof entry.currentSocialSecurityCoverage === "boolean") {
    map.currentSocialSecurityCoverage = entry.currentSocialSecurityCoverage;
  }

  return map;
};

const evaluateNumber = (value: number, op: NumberOperator, target: number) => {
  switch (op) {
    case "eq":
      return value === target;
    case "neq":
      return value !== target;
    case "gt":
      return value > target;
    case "gte":
      return value >= target;
    case "lt":
      return value < target;
    case "lte":
      return value <= target;
    default:
      return true;
  }
};

/* ---------------- COMPONENT ---------------- */

interface Props<T extends { id: number }> {
  periodId: number;
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  context?: PeriodFilterContextDTO;
  onApply: (data: EntryBreakDownDTO[]) => void;
}

export default function AdvancedFilters<T extends { id: number }>({
  show,
  setShow,
  context,
  onApply,
}: Props<T>) {
  const locale = useLocale();
  const [draftFilters, setDraftFilters] = useState<FilterRule[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<FilterRule[]>([]);

  const t = useTranslations("period");

  /* ---------------- FILTER LOGIC ---------------- */

  const applyFilterLogic = (
    breakdowns: EntryBreakDownDTO[],
    filters: FilterRule[],
  ) => {
    if (filters.length === 0) return breakdowns;

    return breakdowns.filter((e) => {
      const valueMap = buildValueMap(e);

      return filters.every((filter) => {
        const value = valueMap[filter.field];
        if (filter.type === "boolean") {
          if (typeof value !== "boolean") return false;
          return filter.operator === "eq"
            ? value === filter.value
            : value !== filter.value;
        }

        if (value === undefined) return true;
        if (typeof value !== "number") return false;

        return evaluateNumber(value, filter.operator, filter.value);
      });
    });
  };

  const applyFilter = () => {
    if (!context) return;

    const filtered = applyFilterLogic(context.breakdowns, draftFilters);

    onApply(filtered);
    setAppliedFilters(draftFilters);
    setShow(false);
  };

  const clearFilter = () => {
    setDraftFilters([]);
    setAppliedFilters([]);
    if (context) onApply(context.breakdowns);
  };

  useEffect(() => {
    if (!context) return;
    onApply(applyFilterLogic(context.breakdowns, appliedFilters));
  }, [context]);

  if (!context) return null;

  /* ---------------- FIELD OPTIONS ---------------- */

  const extendedFields: FieldOption[] = [
    ...context.fields.map((f) => ({
      id: f.nameEng,
      name: f.name,
      nameEng: f.nameEng,
    })),
    { id: "totalOT", name: "ค่าล่วงเวลา", nameEng: "Overtimes" },
    { id: "totalPenalty", name: "ค่าหักลงโทษ", nameEng: "Penalties" },
    { id: "totalDeduction", name: "รายหัก", nameEng: "Deductions" },
    { id: "net", name: "ยอดสุทธิ", nameEng: "Net" },
    { id: "paid", name: "จ่ายเเล้ว", nameEng: "Paid" },
    {
      id: "currentSocialSecurityCoverage",
      name: t("filters.current_social_security"),
      nameEng: t("filters.current_social_security"),
    },
  ];

  /* ---------------- ACTIONS ---------------- */

  const addFilter = () => {
    if (!extendedFields.length) return;

    setDraftFilters((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "number",
        field: extendedFields[0].id,
        operator: "eq",
        value: 0,
      },
    ]);
  };

  const addQuickFilter = (filter: FilterRule) => {
    setDraftFilters((prev) => [
      ...prev,
      { ...filter, id: crypto.randomUUID() },
    ]);
  };

  const updateFilter = <T extends FilterRule>(
    id: string,
    patch: Partial<T>,
  ) => {
    setDraftFilters((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;

        return {
          ...f,
          ...patch,
        } as FilterRule;
      }),
    );
  };

  const removeFilter = (id: string) => {
    setDraftFilters((prev) => prev.filter((f) => f.id !== id));
  };
  const fieldMap = Object.fromEntries(extendedFields.map((f) => [f.id, f]));
  /* ---------------- UI ---------------- */

  return (
    <>
      <div hidden={appliedFilters.length === 0} className="flex gap-3  mt-4">
        {appliedFilters.map((a) => (
          <span
            key={a.id}
            className="flex flex-row gap-2 text-blue-700 bg-blue-100 px-3 py-2 rounded-md text-sm"
          >
            <p>
              {getLocalizedName(
                fieldMap[a.field] || { name: a.field, nameEng: a.field },
                locale,
              )}{" "}
              {numberOperatorsSymbol[a.operator]}{" "}
              {a.type === "boolean"
                ? t(a.value ? "filters.yes" : "filters.no")
                : a.value}
            </p>
            <button
              onClick={() => {
                removeFilter(a.id);
                const remaining = appliedFilters.filter((f) => f.id !== a.id);
                setAppliedFilters(remaining);
                onApply(applyFilterLogic(context.breakdowns, remaining));
              }}
            >
              <Icon icon="basil:cross-solid" fontSize={20} />
            </button>
          </span>
        ))}
      </div>

      <div hidden={!show} className="bg-white mt-4 flex flex-col gap-2">
        <h1 className="text-gray-700">{t("filters.title")} (Beta)</h1>
        <p className="text-xs text-gray-700 mt-2">
          {t("filters.quick_filters.label")}
        </p>
        <section className="flex flex-wrap gap-3">
          {quickFilters.map((q, i) => (
            <button
              key={i}
              onClick={() => addQuickFilter(q.filter as FilterRule)}
              className="flex items-center justify-center text-xs text-gray-700 bg-gray-200 w-fit h-fit px-3 py-1 pt-2 rounded-sm"
            >
              {t(`filters.quick_filters.filters.${q.label}`)}
            </button>
          ))}
        </section>

        <div className="flex flex-col max-w-[700px] justify-center mt-3">
          <div className="space-y-3 mb-4">
            {draftFilters.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {t("filters.no_filter")}
              </p>
            ) : (
              draftFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Field Selection */}
                  <select
                    value={filter.field}
                    className="text-sm flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => {
                      const field = e.target.value;
                      if (isBooleanField(field)) {
                        updateFilter(filter.id, {
                          field,
                          type: "boolean",
                          operator: "eq",
                          value: true,
                        });
                      } else if (filter.type === "boolean") {
                        updateFilter(filter.id, {
                          field,
                          type: "number",
                          operator: "eq",
                          value: 0,
                        });
                      } else {
                        updateFilter(filter.id, { field });
                      }
                    }}
                  >
                    {extendedFields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {getLocalizedName(
                          { name: f.name, nameEng: f.nameEng },
                          locale,
                        )}
                      </option>
                    ))}
                  </select>

                  {/* Operator Selection */}
                  <select
                    value={filter.operator}
                    className="text-sm w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) =>
                      updateFilter(filter.id, {
                        operator: e.target.value as NumberOperator,
                      })
                    }
                  >
                    {(filter.type === "boolean" ? booleanOperators : numberOperators).map((op) => (
                      <option key={op} value={op}>
                        {numberOperatorsSymbol[op]} (
                        {t(`filters.operator.${op}`)})
                      </option>
                    ))}
                  </select>

                  {/* Value Input */}
                  {filter.type === "boolean" ? (
                    <select
                      className="text-sm w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={String(filter.value)}
                      onChange={(e) =>
                        updateFilter(filter.id, {
                          value: e.target.value === "true",
                        })
                      }
                    >
                      <option value="true">{t("filters.yes")}</option>
                      <option value="false">{t("filters.no")}</option>
                    </select>
                  ) : (
                    <NativeInput
                      type={"number"}
                      value={filter.value as unknown as number}
                      onChange={(e) =>
                        updateFilter(filter.id, {
                          value: Number(e.target.value),
                        })
                      }
                      placeholder="Enter value"
                      className="text-sm flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove filter"
                  >
                    <Icon icon="mynaui:trash" fontSize={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={addFilter}
            className="flex items-center justify-center max-w-96 py-2 rounded-md mt-2 w-full border border-dashed border-gray-600 text-gray-600"
          >
            <Icon icon="material-symbols:add-rounded" />
            <p>{t("filters.actions.add_filter")}</p>
          </button>
        </div>

        <div className="flex flex-row-reverse border-t py-2 mt-2">
          <div className="space-x-3">
            <button
              disabled={draftFilters.length === 0 && appliedFilters.length === 0}
              onClick={clearFilter}
              className="text-sm text-gray-700 disabled:text-gray-300"
            >
              <p>{t("filters.actions.clear_all")}</p>
            </button>
            <button
              onClick={applyFilter}
              className="text-sm py-2 px-5 rounded-md bg-blue-600 text-white "
            >
              <p>{t("filters.actions.apply")}</p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
