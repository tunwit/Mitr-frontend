"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { SearchInput } from "@/widget/Input";
import Button from "@mui/joy/Button";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { PAY_PERIOD_STATUS } from "@/types/enum/enum";
import SummaryCard from "@/app/components/Payrolls/summary/SummaryCard";
import ProblemCard from "@/app/components/Payrolls/summary/problemCard";
import { Modal, ModalDialog } from "@mui/joy";
import { useEffect, useMemo, useState } from "react";
import FinalizeModal from "@/app/components/Payrolls/summary/FinalizeModal";

import AdvancedFilters from "@/widget/payroll/AdvancedFilters";
import { useTranslations } from "next-intl";
import SummarySection from "@/app/components/Payrolls/SummarySection";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import {
  usePeriod,
  usePeriodValidate,
} from "@/hooks/payroll/period/hook.period";
import { EntryBreakDownDTO } from "@/types/type.entry";

export default function Home() {
  const { periodId } = useParams();
  const [openFinalizeModal, setOpenFinalizeModal] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [query, setQuery] = useState("");
  const [debouced] = useDebounce(query, 500);
  const [advancedRows, setAdvancedRows] = useState<EntryBreakDownDTO[] | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const { name } = useCurrentShop();

  const tBreadcrumb = useTranslations("breadcrumb");
  const t = useTranslations("summary_period");
  const tPeriod = useTranslations("period");

  const { data: periodData, isLoading: loadingPeriod } = usePeriod(
    Number(periodId),
  ).getFilterContext;
  const { data: validateData, isLoading: loadingValidate } = usePeriodValidate(
    Number(periodId),
  );

  const pathname = usePathname();
  const router = useRouter();

  // if (error || !periodId) {
  //   const basePath = pathname.replace(/\/summary$/, "");
  //   router.replace(basePath);
  // }
  useEffect(() => {
    if (!periodData?.data) return;
    if (periodData?.data?.status !== PAY_PERIOD_STATUS.DRAFT) {
      const newPath = pathname.replace("/summary", "/view");
      router.push(`${newPath}`);
    }
  }, [periodData]);

  const backToEditHandler = () => {
    const newPath = pathname.replace("/summary", "/edit");
    router.push(`${newPath}`);
  };

  const filtered = useMemo(() => {
    const q = debouced.toLowerCase();
    return (advancedRows ?? periodData?.data?.breakdowns ?? []).filter(({ entry }) => {
      const employee = entry.employee.snapshot;
      return [
        employee.firstName,
        employee.lastName,
        employee.firstName + employee.lastName,
        employee.nickName,
        employee.branch.name,
        employee.branch.nameEng,
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [advancedRows, periodData?.data?.breakdowns, debouced]);

  const isLoading =
    loadingPeriod || loadingValidate || finalizing || !periodData?.data;

  let loadingMessage = "";
  if (finalizing) loadingMessage = t("load.finalizing");
  if (loadingPeriod) loadingMessage = tPeriod("load.loading_payrolls");
  if (loadingPeriod) loadingMessage = tPeriod("load.loading_records");
  if (loadingValidate) loadingMessage = t("load.verifying");

  if (isLoading)
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
    <main className="h-full w-full bg-gray-100 font-medium ">
      <FinalizeModal
        open={openFinalizeModal}
        setOpen={setOpenFinalizeModal}
        setFinalizing={setFinalizing}
        periodSummary={periodData?.data}
        problems={validateData?.data || []}
      />
      <title>{periodData?.data?.name}</title>
      <div className="flex flex-col h-full overflow-y-auto">
        <section className="px-10 pb-5 bg-white w-full border-b border-gray-200 sticky top-0 z-999">
          <Breadcrumbs
            className="mt-10"
            items={[
              { label: name },
              { label: tBreadcrumb("dashboard") },
              { label: tBreadcrumb("payrolls") },
              { label: tBreadcrumb("summary_payroll") },
            ]}
          />
          <div className="mt-5 flex flex-row justify-between">
            <span>
              <p className="text-black text-4xl font-bold">{t("label")}</p>
              <p className=" text-gray-700 mt-2">{periodData?.data?.name}</p>
            </span>

            <div className="flex gap-3">
              <Button
                sx={{ height: 40 }}
                startDecorator={
                  <Icon icon="lets-icons:back-light" fontSize={20} />
                }
                color="neutral"
                variant="outlined"
                onClick={backToEditHandler}
              >
                {t("actions.back_to_edit")}
              </Button>
              <Button
                sx={{ height: 40 }}
                startDecorator={<Icon icon="gg:check-o" fontSize={20} />}
                onClick={() => setOpenFinalizeModal(true)}
              >
                {tPeriod("actions.finalize")}
              </Button>
            </div>
          </div>
        </section>

        <section className="px-10 mt-8">
          <div
            hidden={validateData?.data?.length !== 0}
            className={`bg-green-50 p-4 border border-green-200 rounded-md`}
          >
            <div className="flex flex-row items-center gap-3">
              <Icon
                icon="lets-icons:check-fill"
                className={`text-green-600`}
                fontSize={20}
              />
              <div>
                <p className="text-green-900">{t("no_issue.label")}</p>
                <p className="font-light text-xs text-green-700">
                  {t("no_issue.label")}
                  {t("no_issue.description")}
                </p>
              </div>
            </div>
          </div>

          <div
            hidden={validateData?.data?.length === 0}
            className="bg-white p-4 rounded-md shadow"
          >
            <span className="flex flex-row items-center gap-3">
              <Icon
                icon="ep:warning"
                className="text-orange-700"
                fontSize={20}
              />
              <h1 className="font-semibold text-md">
                {t("issues.label", { count: validateData?.data?.length || 0 })}
              </h1>
            </span>

            <div className="flex flex-col gap-2 mt-3">
              {validateData?.data?.map((v, _) => {
                return <ProblemCard key={_} issue={v} />;
              })}
            </div>
          </div>
        </section>

        <section>
          <div className="mt-8 mx-10 flex flex-col justify-between p-4   bg-white  rounded-md shadow">
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
              onApply={setAdvancedRows}
            />
          </div>
        </section>

        <section className="flex flex-col px-10  mt-5 gap-4">
          {filtered.map((b) => {
            return <SummaryCard key={b.entry.id} breakdown={b} />;
          })}
        </section>
        <section className="px-10 mb-5">
          <SummarySection breakdowns={filtered} />
        </section>
      </div>
    </main>
  );
}
