import { TextArea } from "@/widget/Input";
import {
  Button,
  Modal,
  ModalDialog,
  Tab,
  tabClasses,
  TabList,
  TabPanel,
  Tabs,
} from "@mui/joy";
import React, { useEffect, useState } from "react";
import PayrollTable from "./PayrollTable";
import { calculateOT } from "@/lib/otCalculater";
import { calculatePenalty } from "@/lib/penaltyCalculater";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useRouter } from "next/navigation";
import { showError } from "@/utils/showSnackbar";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useUser } from "@clerk/nextjs";
import Decimal from "decimal.js";
import PayrollSummaryTab from "./PayrollSummaryTab";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedName } from "@/lib/getLocalizedName";
import { EntryWithTotalDTO, UpdateBreakDownDTO } from "@/types/type.entry";
import { PeriodPublicDTO } from "@/types/type.period";
import { useEntryBreakdown } from "@/hooks/payroll/entry/hook.entry";
interface PayrollEditEmployeeModalProps {
  periodData?: PeriodPublicDTO;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRecord: EntryWithTotalDTO | null;
}

export default function PayrollEditEmployeeModal({
  periodData,
  open,
  setOpen,
  selectedRecord,
}: PayrollEditEmployeeModalProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("record");
  const doneHandler = async () => {
    await saveDataHandler();
    queryClient.invalidateQueries({
      queryKey: ["payrollPeriod", "verify", periodData?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["payrollRecord", periodData],
      exact: false,
    });
    queryClient.invalidateQueries({
      queryKey: ["payrollPeriod", periodData?.id],
      exact: false,
    });
    queryClient.invalidateQueries({
      queryKey: ["payrollPeriod", "summary", periodData?.id],
      exact: false,
    });

    setOpen(false);
  };
  const [changedEarning, setChangedEarning] = useState<
    Record<number, { amount: number }>
  >({});
  const [changedDeduction, setChangedDeduction] = useState<
    Record<number, { amount: number }>
  >({});
  const [changedOt, setChangedOt] = useState<
    Record<number, { value?: number; amount: number }>
  >({});
  const [changedPenalty, setChangedPenalty] = useState<
    Record<number, { value?: number; amount: number }>
  >({});
  const [changedDisplay, setChangedDisplay] = useState<
    Record<number, { amount: number }>
  >({});
  const [note, setNote] = useState("");
  const [baseSalary, setBaseSalary] = useState<Decimal>(new Decimal(0));
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<0 | 1 | 2 | 3>(2);
  //0 : changed
  //1 : saving
  //2 : saved
  //3 : failed

  const { id } = useCurrentShop();
  const { user } = useUser();
  const router = useRouter();
  const entryHook = useEntryBreakdown(
    periodData?.id || -1,
    selectedRecord?.id || -1,
  );
  const { data: breakdownData, isLoading } = entryHook.get;
  const { mutateAsync: updateEntryAsync } = entryHook.update;

  const locale = useLocale();

  // reset Datafrom previous employee

  const resetChanged = () => {
    setChangedEarning({});
    setChangedDeduction({});
    setChangedOt({});
    setChangedPenalty({});
  };

  useEffect(() => {
    resetChanged();
    setBaseSalary(new Decimal(breakdownData?.data?.entry.salary || 0));
    setNote(breakdownData?.data?.entry.note || "");
    setIsDirty(false);
  }, [breakdownData]);

  useEffect(() => {
    if (!isDirty) return;
    setState(0);
    const handler = setTimeout(async () => {
      setState(1);
      try {
        await saveDataHandler();
        setIsDirty(false);
        setState(2);
      } catch (err) {
        setState(3);
        showError(`Cannot save data ${err}`);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [
    changedEarning,
    changedDeduction,
    changedOt,
    changedPenalty,
    changedDisplay,
    baseSalary,
    note,
  ]);

  if (isLoading) return <p>Loading...</p>;

  const breakdown = breakdownData?.data;
  if (breakdown === undefined) return <p>Loading...</p>;
  if (!id || !breakdown === null) router.back();

  const saveDataHandler = async () => {
    if (!selectedRecord || !user?.id) return;
    setIsSubmitting(true);
    const result: UpdateBreakDownDTO = {
      entry: {
        note: note,
        salary: baseSalary.toString(),
      },
      items: {
        earnings: [
          ...Object.entries(changedEarning).map(([id, data]) => ({
            id: Number(id),
            amount: String(data.amount),
          })),
        ],
        deductions: [
          ...Object.entries(changedDeduction).map(([id, data]) => ({
            id: Number(id),
            amount: String(data.amount),
          })),
        ],
        ots: [
          ...Object.entries(changedOt).map(([id, data]) => ({
            id: Number(id),
            value: String(data.value),
          })),
        ],
        penalties: [
          ...Object.entries(changedPenalty).map(([id, data]) => ({
            id: Number(id),
            value: String(data.value),
          })),
        ],
        non_calculated: [
          ...Object.entries(changedDisplay).map(([id, data]) => ({
            id: Number(id),
            amount: String(data.amount),
          })),
        ],
      },
    };

    try {
      await updateEntryAsync({ payload: result });
    } catch (err) {
      throw Error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const stateIcon = {
    0: (
      <span className="flex flex-row gap-1 item-center justify-center">
        <Icon
          className="text-gray-500"
          width={20}
          icon={"material-symbols-light:save-outline"}
        />
        <p className="text-sm">{t("edit.status.changed")}</p>
      </span>
    ),

    1: (
      <span className="flex flex-row gap-1 item-center justify-center">
        <Icon
          className="text-gray-500"
          width={20}
          icon={"line-md:upload-loop"}
        />
        <p className="text-sm">{t("edit.status.uploading")}</p>
      </span>
    ),

    2: (
      <span className="flex flex-row gap-1 item-center justify-center">
        <Icon
          className="text-gray-500"
          width={20}
          icon={"material-symbols:check-rounded"}
        />
        <p className="text-sm">{t("edit.status.saved")}</p>
      </span>
    ),
    3: (
      <span className="flex flex-row gap-1 item-center justify-center">
        <Icon
          className="text-gray-500"
          width={20}
          icon={"zondicons:exclamation-outline"}
        />
        <p className="text-sm">{t("edit.status.failed")}</p>
      </span>
    ),
  };

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalDialog sx={{ background: "#fafafa", maxHeight: "90%" }}>
          <div className="flex flex-row justify-between items-center">
            <p>{t("edit.label")}</p>

            {stateIcon[state]}
          </div>
          <p className="text-3xl font-bold">
            {selectedRecord?.employee.snapshot.firstName}{" "}
            {selectedRecord?.employee.snapshot.lastName}
          </p>
          <div
            hidden={!isLoading}
            className="flex flex-col justify-center items-center gap-2"
          >
            <Icon icon="ph:spinner" className="animate-spin" fontSize={40} />
            <p>{t("edit.load.loading")}</p>
          </div>
          <div
            hidden={isLoading}
            className="gap-5 bg-white p-4 rounded-sm shadow-sm w-full overflow-y-scroll"
          >
            <Tabs aria-label="Basic tabs" defaultValue={0}>
              <TabList
                tabFlex="auto"
                disableUnderline
                sx={{
                  [`& .${tabClasses.root}`]: {
                    fontSize: "sm",
                    fontWeight: "lg",
                    [`&[aria-selected="true"]`]: {
                      bgcolor: "background.surface",
                    },
                    [`&.${tabClasses.focusVisible}`]: {
                      outlineOffset: "-4px",
                    },
                  },
                }}
              >
                <Tab color="success">{t("edit.tabs.income")}</Tab>
                <Tab color="danger">{t("edit.tabs.deduction")}</Tab>
                <Tab color="neutral">{t("edit.tabs.overtime")}</Tab>
                <Tab color="neutral">{t("edit.tabs.absent")}</Tab>
                <Tab color="neutral" sx={{ whiteSpace: "nowrap" }}>
                  {t("edit.tabs.display_only")}
                </Tab>
                <Tab color="warning">{t("edit.tabs.summary")}</Tab>
              </TabList>
              <TabPanel value={0}>
                <PayrollTable
                  showIncomeRow={true}
                  salary={"1"}
                  data={breakdown.items.earnings || []}
                  renderName={(item) => getLocalizedName(item, locale)}
                  renderAmount={(item) => Number(item.amount)}
                  amountValues={changedEarning}
                  setInputValues={setChangedEarning}
                  setIsDirty={setIsDirty}
                  baseSalary={baseSalary}
                  setBaseSalary={setBaseSalary}
                />
              </TabPanel>
              <TabPanel value={1}>
                <PayrollTable
                  data={breakdown.items.deductions || []}
                  renderName={(item) => getLocalizedName(item, locale)}
                  renderAmount={(item) => Number(item.amount)}
                  amountValues={changedDeduction}
                  setInputValues={setChangedDeduction}
                  setIsDirty={setIsDirty}
                />
              </TabPanel>
              <TabPanel value={2} keepMounted={true}>
                <PayrollTable
                  data={breakdown.items.ots || []}
                  renderName={(item) => getLocalizedName(item, locale)}
                  renderAmount={(item) => Number(item.amount)}
                  showValueColumn={true}
                  autoCalculate={true}
                  baseSalary={baseSalary}
                  calculateAmount={(item, v) =>
                    calculateOT(
                      baseSalary,
                      v,
                      item.type,
                      item.method,
                      new Decimal(periodData?.work_hours_per_day || 0),
                      new Decimal(periodData?.workdays_per_month || 0),
                      item.multiplier,
                      item.fixedAmount,
                    )
                  }
                  amountValues={changedOt}
                  setInputValues={setChangedOt}
                  setIsDirty={setIsDirty}
                />
              </TabPanel>
              <TabPanel value={3} keepMounted={true}>
                <PayrollTable
                  data={breakdown.items.penalties || []}
                  renderName={(item) => getLocalizedName(item, locale)}
                  renderAmount={(item) => Number(item.amount)}
                  showValueColumn={true}
                  autoCalculate={true}
                  baseSalary={baseSalary}
                  calculateAmount={(item, v) =>
                    calculatePenalty(
                      baseSalary,
                      v,
                      item.type,
                      item.method,
                      new Decimal(periodData?.work_hours_per_day || 0),
                      new Decimal(periodData?.workdays_per_month || 0),
                      item.fixedAmount,
                    )
                  }
                  amountValues={changedPenalty}
                  setInputValues={setChangedPenalty}
                  setIsDirty={setIsDirty}
                />
              </TabPanel>
              <TabPanel value={4} keepMounted={true}>
                <PayrollTable
                  data={breakdown.items.non_calculated || []}
                  renderName={(item) => getLocalizedName(item, locale)}
                  renderAmount={(item) => Number(item.amount)}
                  amountValues={changedDisplay}
                  setInputValues={setChangedDisplay}
                  setIsDirty={setIsDirty}
                  baseSalary={baseSalary}
                  setBaseSalary={setBaseSalary}
                  showFooter={false}
                />
              </TabPanel>
              <TabPanel value={5}>
                <PayrollSummaryTab
                  periodId={periodData?.id || -1}
                  entryId={selectedRecord?.id || -1}
                />
              </TabPanel>
            </Tabs>
          </div>

          <div
            hidden={isLoading}
            className="gap-5 h-fit bg-white p-3 rounded-sm shadow-sm w-full"
          >
            <span className="flex flex-row items-center gap-2 ">
              <h1 className="font-bold text-lg">{t("fields.note")}</h1>
              <p className="text-xs text-gray-500">{t("info.note")}</p>
            </span>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{ height: "60px", padding: 1 }}
            />
          </div>
          <Button
            loading={isSubmitting}
            disabled={isLoading || isSubmitting}
            onClick={() => {
              doneHandler();
            }}
          >
            {t("edit.actions.done")}
          </Button>
        </ModalDialog>
      </Modal>
    </>
  );
}
