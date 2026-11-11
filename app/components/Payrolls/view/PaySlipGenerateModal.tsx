import React, { Dispatch, SetStateAction, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import Image from "next/image";
import { Checkbox, Modal, ModalDialog } from "@mui/joy";
import { dateFormat, moneyFormat } from "@/utils/formmatter";
import { showError } from "@/utils/showSnackbar";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { getLocalizedName } from "@/lib/getLocalizedName";
import ChangableAvatar from "@/widget/ChangableAvatar";
import { useCheckBox } from "@/hooks/useCheckBox";
import { usePathname } from "next/navigation";
import { usePayslipVersions, usePeriodSlips } from "@/hooks/payroll/period/hook.period";
import { PeriodFilterContextDTO } from "@/types/type.period";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { publicBackendUrl } from "@/utils/fetcher";

interface PaySlipGenerateModalProps {
  periodContext: PeriodFilterContextDTO;
  revisionId?: number;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
export default function PaySlipGenerateModal({
  periodContext,
  revisionId,
  open,
  setOpen,
}: PaySlipGenerateModalProps) {
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
    {},
  );
  const [downloadingAll, setDownloadingAll] = useState(false);
  const {
    isChecked,
    toggle,
    checked,
    isAllChecked,
    isSomeChecked,
    checkall,
    uncheckall,
  } = useCheckBox<number>(`payslip-${periodContext.id}-${revisionId ?? "legacy"}`);
  const entryIds = periodContext.breakdowns.map(({ entry }) => entry.id);
  const selectedIds = checked.filter((id) => entryIds.includes(id));

  const { pdf, zip } = usePeriodSlips(periodContext.id);
  const { mutateAsync: getSlip } = zip;

  const t = useTranslations("view_payroll.generate");
  const tPeriod = useTranslations("period");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale();
  const format = useFormatter();
  const { id: shopId } = useCurrentShop();
  const versions = usePayslipVersions(periodContext.id, open ? revisionId : undefined);
  const versionsByEntry = versions.data?.data;
  const stored = revisionId !== undefined;
  const canDownloadAll = !stored || (!versions.isError && entryIds.every((id) =>
    versionsByEntry?.[id]?.[0]?.status === "ready",
  ));

  const pdfHref = (entryId: number, pdfRevision: number) =>
    `${publicBackendUrl}/shops/${shopId}/periods/${periodContext.id}/pay-slips/entries/${entryId}/pdf?revisionId=${pdfRevision}`;

  const formatRevisionDate = (date: string, withTime = false) => format.dateTime(new Date(date), {
    dateStyle: "medium",
    timeStyle: withTime ? "short" : undefined,
    timeZone: "Asia/Bangkok",
  });

  const pdfActions = (entryId: number, pdfRevision: number, version: number, name: string, compact = false) => {
    const href = pdfHref(entryId, pdfRevision);
    return (
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("action.preview_revision", { name, version })}
          className="inline-flex min-h-8 items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {compact && <Image src="/payslip/eye.svg" width={18} height={18} alt="" className="sm:hidden" />}
          <span className={compact ? "hidden sm:inline" : undefined}>{t("action.preview_pdf")}</span>
        </a>
        <button
          type="button"
          onClick={() => void downloadIndividual(entryId, pdfRevision)}
          disabled={loadingStates[entryId] || downloadingAll}
          aria-label={t("action.download_revision", { name, version })}
          className="inline-flex size-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          {loadingStates[entryId] ? <Loader2 size={18} className="animate-spin" /> : <Image src="/payslip/download.svg" width={18} height={18} alt="" />}
        </button>
      </div>
    );
  };

  const downloadIndividual = async (entryId: number, pdfRevision?: number) => {
    setLoadingStates((prev) => ({ ...prev, [entryId]: true }));
    try {
      if (pdfRevision === undefined) {
        await getSlip({ payload: { entryIds: [entryId] } });
      } else {
        await pdf.mutateAsync({ entryId, revisionId: pdfRevision });
      }
    } catch {
      showError(t("modal.download.fail"));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [entryId]: false }));
    }
  };

  const downloadZip = async (ids: number[]) => {
    setDownloadingAll(true);
    try {
      await getSlip({ payload: { entryIds: ids, revisionId } });
    } catch {
      showError(t("modal.download.fail"));
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleCheckAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      checkall(entryIds);
    } else {
      uncheckall();
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog aria-labelledby="payslip-dialog-title" sx={{ padding: 0, width: "min(40rem, calc(100% - 2rem))" }}>
        <div className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-xl bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-blue-50 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-[38px] items-center justify-center rounded-lg bg-blue-600">
                <Image src="/payslip/file.svg" width={20} height={20} alt="" />
              </div>
              <div>
                <h2 id="payslip-dialog-title" className="text-xl font-semibold text-gray-900">
                  {t("label")}
                </h2>
                <p className="text-sm text-gray-600">
                  {tPeriod("fields.period")}:{" "}
                  {dateFormat(new Date(periodContext.start_period))} -{" "}
                  {dateFormat(new Date(periodContext.end_period))}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("action.close")}
              className="inline-flex size-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
            >
              <Image src="/payslip/close.svg" width={18} height={18} alt="" />
            </button>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={isAllChecked(periodContext.employeeCount)}
                  indeterminate={isSomeChecked(periodContext.employeeCount)}
                  onChange={handleCheckAll}
                />
                <p className="font-medium text-gray-700">
                  {tc("select_all", { count: periodContext.employeeCount })}
                </p>
              </label>
            </div>
            {stored && versions.isError ? (
              <div className="flex items-center gap-3 py-4 text-sm">
                <p role="alert" className="text-red-700">{t("history.load_error")}</p>
                <button
                  type="button"
                  className="font-medium text-blue-700"
                  onClick={() => void versions.refetch()}
                >
                  {t("history.retry")}
                </button>
              </div>
            ) : stored && !versionsByEntry ? (
              <p className="py-4 text-sm text-gray-600" role="status">{t("history.loading")}</p>
            ) : (
              <div className="mt-2 space-y-2.5">
                {periodContext.breakdowns.map(({ entry, calculation }) => {
                  const { firstName, lastName, branch } = entry.employee.snapshot;
                  const name = `${firstName} ${lastName}`;
                  const entryVersions = versionsByEntry?.[entry.id] ?? [];
                  const [current, ...earlier] = entryVersions;
                  const history = earlier
                    .map((version, index) => ({ ...version, number: earlier.length - index }))
                    .filter((version) => version.status === "ready");
                  return (
                    <article
                      key={entry.id}
                      className={`overflow-hidden rounded-lg border ${isChecked(entry.id) ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3">
                        <Checkbox
                          checked={isChecked(entry.id)}
                          onChange={() => toggle(entry.id)}
                          slotProps={{ input: { "aria-label": t("action.select_employee", { name }) } }}
                        />
                        <ChangableAvatar
                          src={entry.employee.avatar ?? ""}
                          size={32}
                          fallbackTitle={firstName.charAt(0)}
                          editable={false}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                          <p className="text-xs text-gray-600">
                            {current
                              ? t("history.current", { version: entryVersions.length, date: formatRevisionDate(current.createdAt) })
                              : stored ? t("history.unavailable") : getLocalizedName(branch, locale)}
                          </p>
                        </div>
                        <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto">
                          <p className="text-sm font-semibold text-gray-900">฿{moneyFormat(calculation.netPay)}</p>
                          {current?.status === "ready" ? (
                            pdfActions(entry.id, current.revisionId, entryVersions.length, name)
                          ) : !stored && (
                            <div className="flex items-center gap-2">
                              <a
                                href={pathname.replace(/\/view\/?$/, `/entry/${entry.id}/preview`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-8 items-center rounded-md border border-gray-300 px-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                              >
                                {t("action.preview")}
                              </a>
                              <button
                                type="button"
                                onClick={() => void downloadIndividual(entry.id)}
                                disabled={loadingStates[entry.id] || downloadingAll}
                                aria-label={t("action.download")}
                                className="inline-flex size-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                              >
                                {loadingStates[entry.id] ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {history.length > 0 && (
                        <details className="group/history">
                          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 px-3 pb-1 text-xs font-medium text-blue-700 hover:underline sm:pl-[4.375rem] [&::-webkit-details-marker]:hidden">
                            <Image src="/payslip/chevron-up.svg" width={14} height={14} alt="" className="rotate-180 group-open/history:rotate-0" />
                            <span className="group-open/history:hidden">{t("history.earlier", { count: history.length })}</span>
                            <span className="hidden group-open/history:inline">{t("history.hide")}</span>
                          </summary>
                          <ul className="space-y-1 border-t border-gray-200 bg-gray-50 px-3 py-1.5 sm:pl-[4.375rem]">
                            {history.map((version) => (
                              <li key={version.revisionId} className="flex min-h-11 items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-medium text-gray-900">{t("history.revision", { version: version.number })}</p>
                                  <p className="text-xs text-gray-600">{formatRevisionDate(version.createdAt, true)}</p>
                                </div>
                                {pdfActions(entry.id, version.revisionId, version.number, name, true)}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-4 border-t border-gray-200 bg-gray-50 justify-between items-center">
            <div className="flex justify-between items-center text-sm text-gray-600 py-4 ">
              <p>
                {" "}
                {tc("selected", {
                  count: `${selectedIds.length} / ${periodContext.employeeCount}`,
                })}
              </p>
              <p>
                {tPeriod("fields.grand_total")}: ฿
                {moneyFormat(periodContext.netPay)}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t("action.close")}
              </button>
              {selectedIds.length > 0 && selectedIds.length < entryIds.length && (
                <button
                  onClick={() => void downloadZip(selectedIds)}
                  disabled={downloadingAll || !canDownloadAll}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
                >
                  {t("action.download_selected")}
                </button>
              )}
              <button
                onClick={() => void downloadZip(entryIds)}
                disabled={downloadingAll || !canDownloadAll || entryIds.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
              >
                {downloadingAll ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t("action.downloading")}
                  </>
                ) : (
                  <>
                    {t(stored ? "action.download_all_current" : "action.download_all")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading Overlay for Download All */}
        {downloadingAll && (
          <div className="fixed inset-0 bg-black/25 backdrop-blur-xs  rounded-lg  flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
              <Loader2 size={48} className="animate-spin text-blue-600" />
              <div className="text-center">
                <p className="font-semibold text-gray-900">
                  {t("modal.download.label")}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {t("modal.download.description")}
                </p>
              </div>
            </div>
          </div>
        )}
      </ModalDialog>
    </Modal>
  );
}
