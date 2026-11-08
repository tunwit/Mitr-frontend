"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { SearchInput } from "@/widget/Input";
import Button from "@mui/joy/Button";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { dateFormat, dateTimeFormat, moneyFormat } from "@/utils/formmatter";
import UsersIcon from "@/assets/icons/UsersIcon";
import { useDebounce } from "use-debounce";
import { Modal, ModalDialog } from "@mui/joy";
import { PAY_PERIOD_STATUS_LABELS } from "@/types/enum/enumLabel";
import { PAY_PERIOD_STATUS } from "@/types/enum/enum";
import SummaryCard from "@/app/components/Payrolls/summary/SummaryCard";
import { motion, AnimatePresence } from "framer-motion";
import UnlockModal from "@/app/components/Payrolls/view/UnlockModal";
import SummarySection from "@/app/components/Payrolls/SummarySection";
import { useTranslations } from "next-intl";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { usePeriod, usePeriodSlips } from "@/hooks/payroll/period/hook.period";
import { EntryBreakDownDTO } from "@/types/type.entry";
import AdvancedFilters from "@/widget/payroll/AdvancedFilters";
import PaySlipGenerateModal from "@/app/components/Payrolls/view/PaySlipGenerateModal";
import SendEmailsModal from "@/app/components/Payrolls/view/SendEmailsModal";

export default function ViewPeriodPage() {
  const [openPayslipGenerate, setOpenPayslipGenerate] = useState(false);
  const [openSendEmails, setOpenSendEmails] = useState(false);
  const [openUnlock, setOpenUnlock] = useState(false);

  const [hideHeader, setHideHeader] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filtered, setFiltered] = useState<EntryBreakDownDTO[]>([]);
  const [query, setQuery] = useState("");
  const [debouced] = useDebounce(query, 500);
  const { periodId } = useParams();
  const tPeriod = useTranslations("period");
  const tv = useTranslations("view_payroll");
  const tc = useTranslations("common");
  const tBreadcrumb = useTranslations("breadcrumb");
  const pathname = usePathname();
  const router = useRouter();
  const { name } = useCurrentShop();
  const periodHook = usePeriod(Number(periodId));
  const slipMutate = usePeriodSlips(Number(periodId));
  const { data: periodData, isLoading: loadingPeriod } =
    periodHook.getFilterContext;

  const onExportAsExcel = async () => {
    await slipMutate.excel.mutateAsync();
  };

  const onPayment = () => {
    const newPath = pathname.replace("/view", "/payment");
    router.push(`${newPath}`);
  };

  useEffect(() => {
    if (periodData?.data?.status === PAY_PERIOD_STATUS.DRAFT) {
      const newPath = pathname.replace("/view", "/edit");
      router.push(`${newPath}`);
    }
  }, [periodData]);

  useEffect(() => {
    if (!periodData?.data) return;
    const q = debouced.toLowerCase();

    setFiltered(
      periodData.data.breakdowns.filter((b) => {
        const entry = b.entry;
        return (
          entry.employee.snapshot.firstName.toLowerCase().includes(q) ||
          entry.employee.snapshot.lastName.toLowerCase().includes(q) ||
          (entry.employee.snapshot.firstName + entry.employee.snapshot.lastName)
            .toLowerCase()
            .includes(q) ||
          entry.employee.snapshot.nickName.toLowerCase().includes(q) ||
          entry.employee.snapshot.branch.name.toLowerCase().includes(q) ||
          entry.employee.snapshot.branch.nameEng.toLowerCase().includes(q)
        );
      }),
    );
  }, [periodData?.data, debouced]);

  const filteredTotalNet = useMemo(() => {
    return filtered.reduce((sum, r) => sum + (r.calculation.netPay || 0), 0);
  }, [filtered]);

  const filteredTotalEarning = useMemo(() => {
    return filtered.reduce(
      (sum, r) => sum + (r.calculation.summary.gross || 0),
      0,
    );
  }, [filtered]);
  const filteredTotalDeduction = useMemo(() => {
    return filtered.reduce(
      (sum, r) => sum + (r.calculation.summary.adjustment || 0),
      0,
    );
  }, [filtered]);

  const filteredTotalSalary = useMemo(() => {
    return filtered.reduce((sum, r) => {
      return sum + ("baseSalary" in r ? Number(r.baseSalary) || 0 : 0);
    }, 0);
  }, [filtered]);

  const period = periodData?.data;
  const isLoading = loadingPeriod || !period;

  let loadingMessage = tc("load.preparing");
  if (loadingPeriod) loadingMessage = tPeriod("load.loading_payrolls");
  if (!period || !periodData?.data)
    return (
      <Modal open={isLoading}>
        <ModalDialog>
          <div className="flex flex-col items-center justify-center">
            <Icon
              icon={"mynaui:spinner"}
              className="animate-spin"
              fontSize={50}
            />

            <p> {loadingMessage}</p>
          </div>
        </ModalDialog>
      </Modal>
    );
  return (
    <main className="h-full  w-full bg-gray-100 font-medium ">
      {/* {openEdit && (
        <PayrollEditEmployeeModal
          periodData={periodData?.data}
          selectedRecord={selectedRecord}
          open={openEdit}
          setOpen={setOpenEdit}
        />
      )} */}
      {openPayslipGenerate && periodData?.data && (
        <PaySlipGenerateModal
          periodContext={periodData.data}
          open={openPayslipGenerate}
          setOpen={setOpenPayslipGenerate}
        />
      )}

      {openSendEmails && periodData?.data && (
        <SendEmailsModal
          periodContext={periodData.data}
          open={openSendEmails}
          setOpen={setOpenSendEmails}
        />
      )}

      <UnlockModal
        periodId={Number(periodId) || -1}
        open={openUnlock}
        setOpen={setOpenUnlock}
      />

      <title>{period.name}</title>

      <div className="flex flex-col h-full bg-white">
        <AnimatePresence initial={false}>
          {!hideHeader && (
            <motion.div
              key="header"
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden relative"
            >
              <section className="px-10 pb-5 bg-white w-full border-b border-gray-200 sticky top-0">
                <Breadcrumbs
                  className="mt-10"
                  items={[
                    { label: name },
                    { label: tBreadcrumb("dashboard") },
                    { label: tBreadcrumb("payrolls") },
                    { label: tBreadcrumb("view_payroll") },
                  ]}
                />
                <div className="mt-5 flex flex-row justify-between items-center   ">
                  <div>
                    <span className="flex flex-row gap-3  items-center  text-black text-4xl font-bold">
                      <p>{period.name}</p>
                      <p className="text-lg opacity-50 font-light">
                        ({tv("info.read_only")})
                      </p>
                    </span>
                    <p className="opacity-50 mt-2">{tv("label")}</p>
                  </div>

                  <div className="flex gap-3 h-fit">
                    <div className="flex items-center gap-2 px-4 rounded-md bg-green-50 text-green-800 border-green-200 border">
                      <Icon
                        icon="icon-park-outline:check-one"
                        className="text-green-600"
                        fontSize={20}
                      />
                      <p className="font-medium">
                        {tPeriod("status.finalized")}
                      </p>
                    </div>
                    <Button
                      startDecorator={<Icon icon="uil:unlock" fontSize={20} />}
                      color="warning"
                      variant="outlined"
                      onClick={() => {
                        setOpenUnlock(true);
                      }}
                    >
                      {tPeriod("actions.unlock")}
                    </Button>
                  </div>
                </div>

                <section className="grid grid-cols-4 gap-4 mt-5">
                  <div className="bg-blue-50 from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">
                          {tPeriod("fields.status")}
                        </p>
                        <p className="text-xl font-bold text-blue-900 mt-1">
                          {tPeriod(
                            `status.${PAY_PERIOD_STATUS_LABELS[period.status ?? PAY_PERIOD_STATUS.DRAFT]?.toLowerCase()}`,
                          )}
                        </p>
                      </div>
                      <div className="bg-blue-200 p-2 rounded-lg">
                        <Icon
                          icon={"mdi:clock-outline"}
                          className="text-blue-700"
                          fontSize={20}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">
                          {tPeriod("fields.employees")}
                        </p>
                        <p className="text-xl font-bold text-purple-900 mt-1">
                          {period.employeeCount}
                        </p>
                      </div>
                      <div className="bg-purple-200 p-2 rounded-lg">
                        <UsersIcon className="text-purple-700 text-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">
                          {tPeriod("fields.grand_total")}
                        </p>
                        <p className="text-xl font-bold text-green-900 mt-1">
                          {moneyFormat(period.netPay || 0)}
                        </p>
                      </div>
                      <div className="bg-green-200 p-2 rounded-lg">
                        <Icon
                          icon="tabler:currency-baht"
                          className="text-green-700 text-xl"
                          fontSize={20}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-700 font-medium">
                          {tPeriod("fields.period")}
                        </p>
                        <p className="text-xl font-bold text-orange-900 mt-1">
                          {dateFormat(new Date(period.start_period || 0))}{" "}
                          {" - "}
                          {dateFormat(new Date(period.end_period || 0))}
                        </p>
                      </div>
                      <div className="bg-orange-200 p-2 rounded-lg">
                        <Icon
                          icon="solar:calendar-outline"
                          className="text-orange-700 text-xl"
                          fontSize={20}
                        />
                      </div>
                    </div>
                  </div>
                </section>
                <button
                  className="flex w-full items-center justify-center mt-4"
                  onClick={() => setHideHeader(!hideHeader)}
                >
                  <Icon icon="icon-park-outline:up" fontSize={20} />
                </button>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="px-10 overflow-y-auto flex-1  space-y-3 ">
          <div hidden={!hideHeader} className={`bg-white py-3 sticky top-0`}>
            <button
              className={`flex w-full items-center justify-center rotate-180  transition-all `}
              onClick={() => setHideHeader(!hideHeader)}
            >
              <Icon icon="icon-park-outline:up" fontSize={20} />
            </button>
          </div>
          <div
            className={`bg-green-50 p-4 border border-green-200 rounded-md my-5`}
          >
            <div className="flex flex-row gap-3">
              <Icon
                icon="icon-park-outline:check-one"
                className={`text-green-600 mt-1`}
                fontSize={20}
              />
              <div>
                <p className="text-green-900">{tv("section.label")}</p>
                <p className="font-light text-xs text-green-700 ">
                  {tv("section.description", {
                    name: `${period.finalized_by?.firstName || "unknown"} 
                        ${period.finalized_by?.lastName || "unknown"} `,
                    date: dateTimeFormat(new Date(period.finalized_at || 0)),
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Icon
                  icon="mage:file-3"
                  className="text-blue-600"
                  fontSize={24}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {tv("actions.generate.label")}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {tv("actions.generate.description")}
                </p>
                <button
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  onClick={() => setOpenPayslipGenerate(true)}
                >
                  {tv("actions.generate.btn")}
                  <Icon
                    icon="lsicon:right-outline"
                    className="text-blue-600"
                    fontSize={24}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Icon
                  icon="mynaui:send"
                  className="text-purple-600"
                  fontSize={24}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {tv("actions.send_mail.label")}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {tv("actions.send_mail.description")}
                </p>
                <button
                  onClick={() => setOpenSendEmails(true)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  {tv("actions.send_mail.btn")}
                  <Icon
                    icon="lsicon:right-outline"
                    className="text-purple-600"
                    fontSize={24}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Icon
                  icon="qlementine-icons:export-16"
                  className="text-orange-600"
                  fontSize={24}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {tv("actions.export.label")}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {tv("actions.export.description")}
                </p>
                <span className="flex flex-row gap-2">
                  <button
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    onClick={onExportAsExcel}
                  >
                    {tv("actions.export.btn")}
                    <Icon
                      icon="lsicon:right-outline"
                      className="text-orange-600"
                      fontSize={24}
                    />
                  </button>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Icon
                  icon="famicons:card-outline"
                  className="text-indigo-600"
                  fontSize={24}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {tv("actions.payment.label")}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {tv("actions.payment.description")}
                </p>
                <button
                  onClick={onPayment}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  {tv("actions.payment.btn")}
                  <Icon
                    icon="lsicon:right-outline"
                    className="text-indigo-600"
                    fontSize={24}
                  />
                </button>
              </div>
            </div>
          </div>
          <section className="flex-1">
            <div className="mt-3 flex flex-col justify-between p-4  bg-white border border-gray-200  rounded-md">
              <div className="flex flex-row justify-between h-10">
                <div className="flex flex-row gap-3 h-full">
                  <div className="w-96 ">
                    <SearchInput
                      type="text"
                      placeholder={tPeriod("search.placeholder")}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-full"
                      stretch
                    />
                  </div>
                  <button
                    className="text-gray-700 border border-gray-300 rounded-md px-4 hover:bg-gray-50"
                    onClick={() => setShowFilter(!showFilter)}
                  >
                    <span className="flex items-center gap-1">
                      <Icon icon={"mdi:filter-outline"} fontSize={18} />{" "}
                      <p className="font-light text-sm">
                        {tPeriod("filters.label")}
                      </p>
                    </span>
                  </button>
                </div>
              </div>
              <AdvancedFilters
                periodId={Number(periodId) || -1}
                show={showFilter}
                setShow={setShowFilter}
                context={periodData.data}
                onApply={(filteredBreakdowns) => {
                  setFiltered(filteredBreakdowns);
                }}
              />
            </div>
          </section>
          <div className="space-y-3 mb-5">
            {filtered.map((b) => {
              return <SummaryCard key={b.entry.id} breakdown={b} />;
            })}
            <SummarySection
              totalSalary={filteredTotalSalary}
              totalDeduction={filteredTotalDeduction}
              totalEarning={filteredTotalEarning}
              totalNet={filteredTotalNet}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
