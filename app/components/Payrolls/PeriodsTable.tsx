import UsersIcon from "@/assets/icons/UsersIcon";
import { useCheckBox } from "@/hooks/useCheckBox";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { PAY_PERIOD_STATUS } from "@/types/enum/enum";
import { dateFormat, moneyFormat } from "@/utils/formmatter";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { useUser } from "@clerk/nextjs";
import { Icon } from "@iconify/react/dist/iconify.js";
import { ChevronRight } from "@mui/icons-material";
import { Checkbox } from "@mui/joy";
import { _Translator, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { PeriodSummaryDTO } from "@/types/type.period";
import { usePeriods } from "@/hooks/payroll/period/hook.period";
import ConfirmModal from "@/widget/ConfirmModal";
import { Link } from "@/i18n/navigation";

interface PeriodsTableProps {
  periods: PeriodSummaryDTO[];
  title: string;
  color: string;
  editable?: boolean;
}

const headerColors: Record<string, string> = {
  gray: "bg-gray-50 border-gray-200",
  green: "bg-green-50 border-green-200",
  amber: "bg-amber-50 border-amber-200",
};

const getStatusBadge = (
  status: keyof typeof PAY_PERIOD_STATUS,
  t: _Translator<Record<string, any>, string>,
) => {
  const styles = {
    [PAY_PERIOD_STATUS.DRAFT]: "bg-gray-100 text-gray-800",
    [PAY_PERIOD_STATUS.FINALIZED]: "bg-green-100 text-green-800",
  };

  const icons = {
    [PAY_PERIOD_STATUS.DRAFT]: <Icon icon="mdi:clock-outline" />,
    [PAY_PERIOD_STATUS.FINALIZED]: <Icon icon="lets-icons:check-fill" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {icons[status]}
      {t(`status.${status.toLowerCase()}`)}
    </span>
  );
};

export default function PeriodsTable({
  periods,
  title,
  color,
  editable = true,
}: PeriodsTableProps) {
  const [isShowConfirmDelete, setIsShowConfirmDelete] = useState(false);
  const { id: shopId } = useCurrentShop();
  const { user } = useUser();
  const t = useTranslations("payrolls");
  const tPeriod = useTranslations("period");
  const tCommon = useTranslations("common");
  const periodHook = usePeriods();
  const pathname = usePathname().replace(/^\/(th|en)/, "");

  const {
    checked,
    isSomeChecked,
    isAllChecked,
    toggle,
    isChecked,
    checkall,
    uncheckall,
  } = useCheckBox<number>(`payrollsTable-${title}`);

  const handleAllCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!periods) return;
    if (e.currentTarget.checked) {
      checkall(periods.map((v) => v.id));
    } else {
      uncheckall();
    }
  };

  const handleDelete = async () => {
    try {
      if (!shopId || !user?.id) return;

      await periodHook.remove.mutateAsync({ ids: checked });
      showSuccess("Delete period success");
    } catch (err) {
      showError(`Delete period failed\n${err}`);
    } finally {
      uncheckall();
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ConfirmModal
          open={isShowConfirmDelete}
          setOpen={setIsShowConfirmDelete}
          onConfirm={handleDelete}
          title={tPeriod("modal.delete.label")}
          description={tPeriod("modal.delete.description", {
            count: checked.length,
          })}
        />
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${headerColors[color] ?? headerColors.gray}`}
        >
          <div className="flex items-center gap-3">
            {editable && (
              <Checkbox
                checked={isAllChecked(periods.length || 0)}
                indeterminate={isSomeChecked(periods.length || 0)}
                onChange={handleAllCheckbox}
              />
            )}
            {!editable && (
              <Icon
                icon={
                  color === "amber" ? "mdi:clock-outline" : "simple-line-icons:check"
                }
                className={
                  color === "amber" ? "text-amber-800" : "text-green-700"
                }
                aria-hidden
                fontSize={15}
              />
            )}
            <h2 className="font-medium text-gray-900">{title}</h2>
            <span className="text-sm text-gray-500">({periods.length})</span>
          </div>
          {checked.length > 0 && (
            <button
              onClick={() => setIsShowConfirmDelete(true)}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Icon icon="mynaui:trash" fontSize={16} />
              {tCommon("selected", { count: checked.length })}
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-200">
          {periods.map((payroll) => (
            <div
              key={payroll.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <Checkbox
                  disabled={!editable}
                  checked={isChecked(payroll.id)}
                  onChange={() => toggle(payroll.id)}
                />

                <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-900">
                      {payroll.name}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <UsersIcon />
                      {payroll.employeeCount} {t("info.people")}
                    </p>
                    {payroll.status === PAY_PERIOD_STATUS.FINALIZED &&
                      payroll.unpaidEmployeeCount > 0 && (
                        <p className="mt-1 text-sm font-medium tabular-nums text-amber-800">
                          {t("info.unpaid_employees", {
                            count: payroll.unpaidEmployeeCount,
                          })}
                        </p>
                      )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      {tPeriod("fields.created_at")}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {dateFormat(new Date(payroll.updatedAt || ""))}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {tPeriod("fields.total_amount")}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {moneyFormat(payroll.netPay)}฿
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    {getStatusBadge(payroll.status, tPeriod)}
                    <Link
                      href={`${pathname}/${payroll.id}/${payroll.status === PAY_PERIOD_STATUS.DRAFT ? "edit" : "view"}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                    >
                      {editable ? t("actions.edit") : t("actions.view")}
                      <ChevronRight />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
