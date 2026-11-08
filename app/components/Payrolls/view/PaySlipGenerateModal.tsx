import React, { Dispatch, SetStateAction, useState } from "react";
import { FileText, Download, X, Loader2, Package } from "lucide-react";
import { Checkbox, Modal, ModalDialog } from "@mui/joy";
import { dateFormat, moneyFormat } from "@/utils/formmatter";
import { Icon } from "@iconify/react/dist/iconify.js";
import { showError } from "@/utils/showSnackbar";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedName } from "@/lib/getLocalizedName";
import ChangableAvatar from "@/widget/ChangableAvatar";
import { useCheckBox } from "@/hooks/useCheckBox";
import { usePathname } from "@/i18n/navigation";
import { usePeriodSlips } from "@/hooks/payroll/period/hook.period";
import { PeriodFilterContextDTO } from "@/types/type.period";

interface PaySlipGenerateModalProps {
  periodContext: PeriodFilterContextDTO;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
export default function PaySlipGenerateModal({
  periodContext,
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
    isNoneChecked,
    checkall,
    uncheckall,
  } = useCheckBox<number>("generate_payslip");

  const { mutateAsync: getSlip } = usePeriodSlips(periodContext.id).zip;

  const t = useTranslations("view_payroll.generate");
  const tPeriod = useTranslations("period");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale();

  const onPreview = async (entryId: number) => {
    const newPath = pathname.replace("/view", `/entry/${entryId}/preview`);
    const tab = window.open("about:blank", "_blank");
    if (!tab) return;
    tab.location.href = `${newPath}`;
  };

  const onDownloadIndividule = async (recordIds: number[]) => {
    setLoadingStates((prev) => ({ ...prev, [recordIds[0]]: true }));
    try {
      await getSlip({ payload: { entryIds: recordIds } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showError(t("modal.download.fail", { err: message }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [recordIds[0]]: false }));
    }
  };

  const handleDownloadChecked = async () => {
    setDownloadingAll(true);
    try {
      await getSlip({ payload: { entryIds: checked } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showError(t("modal.download.fail", { err: message }));
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleCheckAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      checkall(periodContext.breakdowns.map((b) => b.entry.id));
    } else {
      uncheckall();
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog sx={{ padding: 0, width: "40%" }}>
        <div className="bg-white rounded-lg min-w-xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-linear-to-r from-blue-50 to-blue-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
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
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
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
            <div className="space-y-3">
              {periodContext.breakdowns.map((b) => {
                return (
                  <div
                    key={b.entry.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                      isChecked(b.entry.id)
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked(b.entry.id)}
                      onChange={() => toggle(b.entry.id)}
                    />
                    {/* Employee Info */}
                    <ChangableAvatar
                      src={b.entry.employee.avatar ?? ""}
                      size={40}
                      fallbackTitle={b.entry.employee.snapshot.firstName.charAt(
                        0,
                      )}
                      editable={false}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {b.entry.employee.snapshot.firstName}{" "}
                        {b.entry.employee.snapshot.lastName}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-600">
                          {b.entry.employee.snapshot.nickName}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getLocalizedName(
                            b.entry.employee.snapshot.branch,
                            locale,
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0`">
                      <p className="font-medium text-gray-900">
                        ฿{moneyFormat(b.calculation.netPay)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0`">
                      {/* Preview */}
                      <button
                        onClick={() => {
                          onPreview(b.entry.id);
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Preview"
                      >
                        <Icon
                          icon="mdi:eye"
                          fontSize={18}
                          className="text-gray-600"
                        />
                      </button>

                      {/* Download */}
                      <button
                        onClick={() => onDownloadIndividule([b.entry.id])}
                        className="p-2 border border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Download"
                      >
                        {loadingStates[b.entry.id] ? (
                          <Loader2
                            size={18}
                            className="animate-spin text-blue-600"
                          />
                        ) : (
                          <Download size={18} className="text-blue-600" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-4 border-t border-gray-200 bg-gray-50 justify-between items-center">
            <div className="flex justify-between items-center text-sm text-gray-600 py-4 ">
              <p>
                {" "}
                {tc("selected", {
                  count: `${checked.length} of ${periodContext.employeeCount}`,
                })}
              </p>
              <p>
                {tPeriod("fields.grand_total")}: ฿
                {moneyFormat(periodContext.netPay)}
              </p>
            </div>
            <div className="flex flex-row-reverse gap-3">
              <button
                onClick={() => handleDownloadChecked()}
                disabled={downloadingAll || isNoneChecked()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
              >
                {downloadingAll ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t("action.downloading")}
                  </>
                ) : (
                  <>
                    <Package size={18} />
                    {t("action.download_all")}
                  </>
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t("action.close")}
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
