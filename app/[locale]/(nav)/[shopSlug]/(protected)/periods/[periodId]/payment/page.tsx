"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { SearchInput } from "@/widget/Input";
import Button from "@mui/joy/Button";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCheckBox } from "@/hooks/useCheckBox";
import { dateFormat, moneyFormat } from "@/utils/formmatter";
import UsersIcon from "@/assets/icons/UsersIcon";
import { useDebounce } from "use-debounce";
import { Modal, ModalDialog } from "@mui/joy";
import { PAY_PERIOD_STATUS_LABELS } from "@/types/enum/enumLabel";
import { PAY_PERIOD_STATUS } from "@/types/enum/enum";
import { motion, AnimatePresence } from "framer-motion";
import AdvancedFilters from "@/widget/payroll/AdvancedFilters";
import PaymentCard from "@/app/components/Payrolls/payment/PaymentCard";
import { useTranslations } from "next-intl";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { usePeriod } from "@/hooks/payroll/period/hook.period";
import { EntryBreakDownDTO } from "@/types/type.entry";

export default function Home() {
  const methods = useCheckBox<number>("payrollRecordTable");
  const router = useRouter();
  const [showFilter, setShowFilter] = useState(false);
  const { periodId } = useParams();
  const [selectedTab, setSelectedTab] = useState("manual");
  const [query, setQuery] = useState("");
  const [debouced] = useDebounce(query, 500);
  const [filtered, setFiltered] = useState<EntryBreakDownDTO[]>([]);
  const pathname = usePathname();
  const tPeriod = useTranslations("period");
  const tp = useTranslations("payment_payroll");
  const tBreadcrumb = useTranslations("breadcrumb");
  const tc = useTranslations("common");

  const [hideHeader, setHideHeader] = useState(false);
  const { name } = useCurrentShop();

  const { data: periodData, isLoading: loadingPeriod } = usePeriod(
    Number(periodId),
  ).getContextWithPayment;

  // if (error || !periodId) {
  //   const basePath = pathname.replace(/\/payment$/, "");
  //   router.replace(basePath);
  // }

  useEffect(() => {
    if (!periodData?.data) return;
    if (periodData?.data?.status === PAY_PERIOD_STATUS.DRAFT) {
      const newPath = pathname.replace("/payment", "/edit");
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

  const isLoading = loadingPeriod;

  let loadingMessage = tc("load.preparing");
  if (loadingPeriod) loadingMessage = tPeriod("load.loading_payrolls");
  return (
    <main className=" w-full bg-gray-100 font-medium ">
      <title>Payment - Eslip</title>
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
                  className="pt-10"
                  items={[
                    { label: name },
                    { label: tBreadcrumb("dashboard") },
                    { label: tBreadcrumb("payrolls") },
                    { label: tBreadcrumb("payment_payroll") },
                  ]}
                />
                <div className="mt-3 flex flex-row justify-between items-center  text-black text-4xl font-bold">
                  <p>{periodData?.data?.name}</p>
                  <Button
                    sx={{ height: 40 }}
                    startDecorator={
                      <Icon icon="lets-icons:back-light" fontSize={20} />
                    }
                    color="neutral"
                    variant="outlined"
                    onClick={() => {
                      router.back();
                    }}
                  >
                    {tp("actions.back")}
                  </Button>
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
                            `status.${PAY_PERIOD_STATUS_LABELS[periodData?.data?.status ?? PAY_PERIOD_STATUS.DRAFT]?.toLowerCase()}`,
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
                          {periodData?.data?.employeeCount}
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
                          {moneyFormat(periodData?.data?.netPay || 0)}
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
                          {dateFormat(
                            new Date(periodData?.data?.start_period || 0),
                          )}{" "}
                          {" - "}
                          {dateFormat(
                            new Date(periodData?.data?.end_period || 0),
                          )}
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

        <div className="flex flex-1 flex-col h-full gap-5 items-center overflow-y-scroll">
          <div hidden={!hideHeader} className={` py-3 sticky top-0`}>
            <button
              className={`flex w-full items-center justify-center rotate-180  transition-all `}
              onClick={() => setHideHeader(!hideHeader)}
            >
              <Icon icon="icon-park-outline:up" fontSize={20} />
            </button>
          </div>
          <div className={`w-fit ${!hideHeader && "mt-4"}`}>
            <section className="flex w-full justify-center items-center ">
              <div className="flex gap-5 flex-col lg:flex-row w-full">
                <button
                  onClick={() => setSelectedTab("manual")}
                  className={`p-6 rounded-xl border-2 transition-all w-[50%] ${
                    selectedTab === "manual"
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${selectedTab === "manual" ? "bg-blue-500" : "bg-gray-100"}`}
                    >
                      <Icon
                        icon="famicons:card-outline"
                        className={`w-6 h-6 ${selectedTab === "manual" ? "text-white" : "text-gray-600"}`}
                        fontSize={24}
                      />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {tp("tabs.manual.label")}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {tp("tabs.manual.description")}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {tp("tabs.manual.chips.bank_transfer")}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {tp("tabs.manual.chips.promptpay")}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTab("file")}
                  className={`p-6 rounded-xl border-2 transition-all w-[50%] ${
                    selectedTab === "file"
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${selectedTab === "file" ? "bg-green-500" : "bg-gray-100"}`}
                    >
                      <Icon
                        icon="mage:file-3"
                        className={`w-6 h-6 ${selectedTab === "file" ? "text-white" : "text-gray-600"}`}
                        fontSize={24}
                      />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {tp("tabs.generate.label")}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {tp("tabs.generate.description")}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          {tp("tabs.generate.chips.text_file")}
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          {tp("tabs.generate.chips.web")}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </section>
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
                  context={periodData?.data}
                  onApply={(filteredBreakdowns) => {
                    setFiltered(filteredBreakdowns);
                  }}
                />
              </div>
            </section>
            <section className="space-y-3 my-3">
              {filtered?.map((b) => {
                return (
                  <PaymentCard
                    key={b.entry.id}
                    periodId={Number(periodId)}
                    breakdown={b}
                    paymentDetails={
                      periodData!.data!.paymentsByEntryId[b.entry.id]
                    }
                  />
                );
              })}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
