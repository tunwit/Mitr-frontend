import { formatBankAccountNumber, moneyFormat } from "@/utils/formmatter";
import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Check, Copy, QrCode } from "lucide-react";
import { isValidPromptPay } from "@/lib/isValidPromtpay";
import { banks } from "@/utils/bankList";
import Image from "next/image";
import SalaryBreakdown from "@/widget/SalaryBreakdown";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedName } from "@/lib/getLocalizedName";
import { showError } from "@/utils/showSnackbar";
import ChangableAvatar from "@/widget/ChangableAvatar";
import { EntryBreakDownDTO } from "@/types/type.entry";
import { EmployeePaymentDTO } from "@/types/type.employee";
import { useEntry } from "@/hooks/payroll/entry/hook.entry";

interface SummaryCardProps {
  periodId: number;
  breakdown: EntryBreakDownDTO;
  paymentDetails: EmployeePaymentDTO;
}

export default function PaymentCard({
  periodId,
  breakdown,
  paymentDetails,
}: SummaryCardProps) {
  const paid = !!breakdown.entry.paidAt;
  const { mutateAsync: setPaidMutate, isPending: isUpdatingPayment } =
    useEntry(Number(periodId)).setPaid;
  const [expanded, setExpanded] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const te = useTranslations("employees");
  const tr = useTranslations("record");
  const tp = useTranslations("payment_payroll");

  const locale = useLocale();
  const [copiedId, setCopiedId] = useState("");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };
  const handleMarkedAsPaid = async (setTo: boolean) => {
    try {
      await setPaidMutate({
        payload: { entryId: breakdown.entry.id, paid: setTo },
      });
    } catch (err) {
      showError(`fail to mark as paid ${err}`);
    }
  };

  const bank = banks.find((b) => b.label === paymentDetails.bankName);
  return (
    <div className="space-y-4">
      <div className="hover:shadow bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Employee Header */}
        <div
          className="bg-white px-6 py-4 border-b border-gray-200 grid grid-cols-[1fr_auto] gap-4 items-center cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
            <ChangableAvatar
              src={breakdown.entry.employee.avatar || ""}
              fallbackTitle={breakdown.entry.employee.snapshot.firstName.charAt(
                0,
              )}
              editable={false}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {breakdown.entry.employee.snapshot.firstName}{" "}
                {breakdown.entry.employee.snapshot.lastName}
              </h3>
              <span className="flex items-center gap-2">
                <p className="text-xs text-gray-600">
                  {paymentDetails.bankName} •{" "}
                  {formatBankAccountNumber(
                    paymentDetails.bankAccountNumber || "",
                  )}
                </p>
                <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getLocalizedName(
                    breakdown.entry.employee.snapshot.branch,
                    locale,
                  )}
                </p>
              </span>
            </div>
          </div>

          <div className="flex gap-5 items-center">
            <span
              hidden={!paid}
              className="flex text-green-600 text-xs gap-1 items-center self-baseline-last bg-green-100 px-2 py-1 rounded-lg border border-green-600"
            >
              <Icon icon="ic:outline-paid" /> {tr("fields.paid")}
            </span>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase mb-1">
                {tr("fields.net")}
              </p>
              <p className="text-xl font-semibold text-gray-900">
                ฿ {moneyFormat(breakdown.calculation.netPay)}
              </p>
            </div>
            <Icon
              icon="mingcute:down-line"
              fontSize={30}
              className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Salary Breakdown */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="bg-gray-50">
                <section className="p-6 grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">
                        {tp("tabs.manual.sections.bank_transfer")}
                      </h4>
                    </div>

                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <div>
                        <label className="text-xs text-gray-600 uppercase tracking-wide">
                          {te("fields.bank")}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Image
                            className="rounded-sm"
                            unoptimized={true}
                            loading="lazy"
                            width="20"
                            height="20"
                            src={`/bankIcons/${bank?.code}.png`}
                            alt="bank logo"
                          />
                          <p className="font-medium text-gray-900">
                            {paymentDetails.bankName}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 uppercase tracking-wide">
                          {te("fields.bank_account_number")}
                        </label>
                        <div className="flex items-center justify-between mt-1">
                          <p className="font-mono font-medium text-gray-900">
                            {formatBankAccountNumber(
                              paymentDetails.bankAccountNumber || "",
                            )}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(
                                paymentDetails.bankAccountNumber || "",
                                `bank-${breakdown.entry.id}`,
                              );
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          >
                            {copiedId === `bank-${breakdown.entry.id}` ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 uppercase tracking-wide">
                          {te("fields.bank_account_owner")}
                        </label>
                        <p className="font-medium text-gray-900 mt-1">
                          {paymentDetails.bankAccountOwner}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 uppercase tracking-wide">
                          {tr("fields.net")}
                        </label>
                        <div className="flex items-center justify-between mt-1">
                          <p className="font-mono font-semibold text-xl text-gray-900">
                            ฿{moneyFormat(breakdown.calculation.netPay)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(
                                breakdown.calculation.netPay.toString(),
                                `amount-${breakdown.entry.id}`,
                              );
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          >
                            {copiedId === `amount-${breakdown.entry.id}` ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      hidden={paid}
                      disabled={isUpdatingPayment}
                      onClick={() => {
                        handleMarkedAsPaid(true);
                      }}
                      className="bg-blue-600 text-white py-2 px-3 text-sm rounded-lg disabled:opacity-60"
                    >
                      {tr("actions.mark_as_paid")}
                    </button>
                    <button
                      onClick={() => {
                        handleMarkedAsPaid(false);
                      }}
                      hidden={!paid}
                      disabled={isUpdatingPayment}
                      className="bg-green-600 text-white py-2 px-3 text-sm rounded-lg disabled:opacity-60"
                    >
                      {tr("actions.unmarked")}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <QrCode className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">
                        {tp("tabs.manual.sections.promptpay")}
                      </h4>
                    </div>

                    <div className="bg-white rounded-lg p-4 space-y-3 ">
                      {isValidPromptPay(paymentDetails.promtpay || "") ? (
                        <>
                          <div className="flex justify-center py-4">
                            <div className="w-48 h-48  bg-purple-200  rounded-lg flex items-center justify-center p-2">
                              <div className="text-center">
                                <img
                                  className="rounded-md"
                                  src={`https://promptpay.io/${paymentDetails.promtpay ? paymentDetails.promtpay.trim() : ""}/${breakdown.calculation.netPay.toString()}.png`}
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 uppercase tracking-wide">
                              {te("fields.promtpay")}
                            </label>
                            <div className="flex items-center justify-between mt-1">
                              <div>
                                <p className="font-mono font-medium text-gray-900">
                                  {paymentDetails.promtpay}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(
                                    paymentDetails.promtpay || "",
                                    `pp-${breakdown.entry.id}`,
                                  );
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              >
                                {copiedId === `pp-${breakdown.entry.id}` ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full flex justify-center items-center h-[252px]  ">
                          <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                            <div className="text-center px-4">
                              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500 font-medium">
                                {tp("info.qr_not_available")}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
                <section className="flex justify-center pb-2">
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-blue-700 underline flex items-center"
                  >
                    <Icon
                      icon="mingcute:down-line"
                      fontSize={20}
                      className={`${showBreakdown ? "rotate-180" : ""}`}
                    />
                    <p>{tp("actions.view_details")}</p>
                  </button>
                </section>
                <div className="bg-blue-50 flex items-center gap-2 border border-blue-200 p-2 m-2 rounded-md my-1 mb-3">
                  <p className="text-blue-900 font-bold">
                    {tr("fields.note")}:
                  </p>
                  <p className="text-sm text-blue-800">
                    {" "}
                    {breakdown.entry.note ? breakdown.entry.note : "-"}
                  </p>
                </div>
                <section hidden={!showBreakdown} className="bg-white">
                  <SalaryBreakdown breakdown={breakdown} />
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
