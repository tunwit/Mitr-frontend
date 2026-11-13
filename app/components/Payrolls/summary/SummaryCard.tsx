

import { moneyFormat } from "@/utils/formmatter";
import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SalaryBreakdown from "@/widget/SalaryBreakdown";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedName } from "@/lib/getLocalizedName";
import ChangableAvatar from "@/widget/ChangableAvatar";
import { EntryBreakDownDTO } from "@/types/type.entry";
import Button from "@mui/joy/Button";

interface SummaryCardProps {
  breakdown: EntryBreakDownDTO;
  onViewPayslip?: () => void;
  payslipDisabled?: boolean;
}

export default function SummaryCard({ breakdown, onViewPayslip, payslipDisabled }: SummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("record");
  const tPayslip = useTranslations("view_payroll.generate.action");
  const locale = useLocale();
  return (
    <div className="space-y-4">
      <div className="hover:shadow bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Employee Header */}
        <div
          className={`bg-gray-50 px-6 py-4 border-b border-gray-200 grid gap-4 items-center cursor-pointer ${onViewPayslip ? "md:grid-cols-[1fr_auto]" : "grid-cols-[1fr_auto]"}`}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
            <ChangableAvatar
              src={breakdown.entry.employee.avatar ?? ""}
              fallbackTitle={breakdown.entry.employee.snapshot.firstName.charAt(0)}
              editable={false}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {breakdown.entry.employee.snapshot.firstName}{" "}
                {breakdown.entry.employee.snapshot.lastName}
              </h3>
              <div className="grid grid-cols-[auto_auto] gap-3 mt-1 w-fit">
                <p className="text-sm text-gray-600">
                  {breakdown.entry.employee.snapshot.nickName}
                </p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getLocalizedName(breakdown.entry.employee.snapshot.branch, locale)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 sm:gap-5 items-center">
            <span
              hidden={!breakdown.entry.paidAt}
              className="flex text-green-600 text-xs gap-1 items-center self-baseline-last bg-green-100 px-2 py-1 rounded-lg border border-green-600"
            >
              <Icon icon="ic:outline-paid" /> {t("fields.paid")}
            </span>
            <div className="text-right">
              <p className="text-sm text-gray-500 uppercase mb-1">
                {t("fields.net")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                ฿ {moneyFormat(breakdown.calculation.netPay)}
              </p>
            </div>
            {onViewPayslip && (
              <Button
                variant="outlined"
                aria-haspopup="dialog"
                disabled={payslipDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  onViewPayslip();
                }}
              >
                {tPayslip("preview")}
              </Button>
            )}
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
              <SalaryBreakdown breakdown={breakdown} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
