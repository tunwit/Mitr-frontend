"use client";
import { NativeInput } from "@/widget/Input";
import { usePeriod } from "@/hooks/payroll/period/hook.period";
import { ISSUE_TYPE, ValidationResultDTO } from "@/types/payroll/type.validate";
import { PeriodSummaryDTO } from "@/types/type.period";
import { dateFormat, formatMetaMoney, moneyFormat } from "@/utils/formmatter";
import { showError } from "@/utils/showSnackbar";
import { useUser } from "@clerk/nextjs";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Button, Modal, ModalClose, ModalDialog } from "@mui/joy";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import React, { Dispatch, SetStateAction, useState } from "react";

interface FinalizeModalPros {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setFinalizing: Dispatch<SetStateAction<boolean>>;
  periodSummary?: PeriodSummaryDTO;
  problems: ValidationResultDTO[];
}
export default function FinalizeModal({
  open,
  setOpen,
  setFinalizing,
  periodSummary,
  problems,
}: FinalizeModalPros) {
  const { user } = useUser();
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("period");
  const tf = useTranslations("finalized_period");
  const tc = useTranslations("common");
  const tr = useTranslations("record");
  const tp = useTranslations("period");
  const ts = useTranslations("summary_period");

  const { mutateAsync: finalizeAsync } = usePeriod(
    periodSummary?.id || -1,
  ).finalize;
  const isCriticalPresence =
    problems.filter((p) => p.type === ISSUE_TYPE.CRITICAL).length > 0;

  const finalizeHandler = async () => {
    if (!periodSummary || isCriticalPresence || !user) return;
    setFinalizing(true);
    try {
      await finalizeAsync();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const newPath = pathname.replace("/summary", "/view");
      router.push(`${newPath}`);
      setOpen(false);
    } catch (err) {
      showError(`Cannot finalize payroll ${err}`);
    } finally {
      setFinalizing(false);
    }
  };
  if (!periodSummary) return;

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog sx={{ padding: 0, width: "50%" }}>
        <ModalClose />
        <section className="bg-blue-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-sm">
              <Icon
                icon="simple-line-icons:check"
                fontSize={24}
                className="text-white"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {tf("label")}
              </h2>
              <p className="text-sm text-gray-600">{tf("description")}</p>
            </div>
          </div>
        </section>
        <section className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {tf("sections.information")}
            </h3>
            <div className="bg-gray-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon icon="solar:calendar-outline" fontSize={18} />
                  <span className="text-sm">{t("fields.period")}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {dateFormat(new Date(periodSummary?.start_period || 0))}{" "}
                  {" - "}
                  {dateFormat(new Date(periodSummary?.end_period || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon icon="mynaui:users" fontSize={18} />
                  <span className="text-sm">{t("fields.total_employees")}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {tc("unit.people", {
                    count: periodSummary?.employeeCount || 0,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {tf("sections.financial")}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-600">
                  {tr("fields.base_salary")}
                </span>
                <span className="font-medium text-gray-900">
                  ฿ {moneyFormat(0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">
                  + {tr("fields.total_earning")}
                </span>
                <span className="font-medium text-green-700">
                  ฿ {moneyFormat(periodSummary?.summary.gross || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-700">
                  - {tr("fields.total_deduction")}
                </span>
                <span className="font-medium text-red-700">
                  ฿ {moneyFormat(periodSummary?.summary.adjustment || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="tabler:currency-baht"
                    className="text-blue-700"
                    fontSize={20}
                  />
                  <span className="font-semibold text-blue-900">
                    {tp("fields.grand_total")}
                  </span>
                </div>
                <span className="text-2xl font-bold text-blue-900">
                  ฿ {moneyFormat(periodSummary?.netPay || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div
              hidden={problems.length !== 0}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <Icon
                  icon="lets-icons:check-fill"
                  className={`text-green-500`}
                  fontSize={20}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">
                    {ts("no_issue.label")}
                  </h4>
                  <p className="text-sm text-green-700 mt-2">
                    {ts("no_issue.description")}
                  </p>
                </div>
              </div>
            </div>

            <div
              hidden={
                problems.filter((p) => p.type === ISSUE_TYPE.WARNING).length <=
                0
              }
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <Icon
                  icon="ion:warning-outline"
                  className="text-yellow-600 mt-0.5"
                  fontSize={20}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    {ts("issues.label", {
                      count: problems.filter(
                        (p) => p.type === ISSUE_TYPE.WARNING,
                      ).length,
                    })}
                  </h4>
                  <ul className="space-y-2">
                    {problems
                      .filter((p) => p.type === ISSUE_TYPE.WARNING)
                      .map((p, _) => {
                        return (
                          <li key={_} className="text-sm text-yellow-800">
                            <span className="font-medium">
                              {p.employee.firstName} {p.employee.lastName} :
                            </span>{" "}
                            {ts(
                              `issues.code.${p.code}`,
                              formatMetaMoney(p.meta) || {},
                            )}
                          </li>
                        );
                      })}
                  </ul>
                  <p className="text-sm text-yellow-700 mt-2">
                    {ts("issues.description")}
                  </p>
                </div>
              </div>
            </div>

            <div
              hidden={
                problems.filter((p) => p.type === ISSUE_TYPE.CRITICAL).length <=
                0
              }
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <Icon
                  icon="mdi:forbid"
                  className="text-red-600 mt-0.5"
                  fontSize={20}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">
                    {ts("critical_issue.label", {
                      count: problems.filter(
                        (p) => p.type === ISSUE_TYPE.CRITICAL,
                      ).length,
                    })}
                  </h4>
                  <ul className="space-y-2">
                    {problems
                      .filter((p) => p.type === ISSUE_TYPE.CRITICAL)
                      .map((p, _) => {
                        return (
                          <li key={_} className="text-sm text-red-800">
                            <span className="font-medium">
                              {p.employee.firstName} {p.employee.lastName} :
                            </span>{" "}
                            {ts(
                              `issues.code.${p.code}`,
                              formatMetaMoney(p.meta) || {},
                            )}
                          </li>
                        );
                      })}
                  </ul>
                  <p className="text-sm text-red-700 mt-2">
                    {ts("critical_issue.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon
                icon="material-symbols:info-outline-rounded"
                className="text-blue-600 mt-0.5"
                fontSize={24}
              />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">
                  {tf("info.label")}
                </h4>
                <ul className="space-y-1.5 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <Icon
                      icon="ic:outline-lock"
                      fontSize={18}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{tf("info.lock_payroll")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      icon="simple-line-icons:check"
                      fontSize={18}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{tf("info.to_finalized")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      icon="material-symbols:mail-outline"
                      fontSize={18}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{tf("info.generate_payslip")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <NativeInput
                type="checkbox"
                className="mt-1 rounded"
                checked={confirmCheckbox}
                onChange={(e) => setConfirmCheckbox(!confirmCheckbox)}
              />
              <span className="text-sm text-gray-700">
                {tf("info.acknownledge")}
              </span>
            </label>
          </div>

          <div className="py-4 border-t border-gray-200 bg-gray-50 flex gap-4 items-center flex-row-reverse">
            <Button
              disabled={!confirmCheckbox || isCriticalPresence}
              startDecorator={
                <Icon
                  icon="simple-line-icons:check"
                  fontSize={20}
                  className="text-white"
                />
              }
              onClick={finalizeHandler}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-colors"
            >
              {tp("actions.finalize")}
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700"
            >
              {tf("actions.cancle")}
            </Button>
          </div>
        </section>
      </ModalDialog>
    </Modal>
  );
}
