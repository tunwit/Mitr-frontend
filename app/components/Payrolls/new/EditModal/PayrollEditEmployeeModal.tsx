import { Box, Button, Modal, ModalDialog, Tab, tabClasses, TabList, TabPanel, Tabs } from "@mui/joy";
import { useEffect, useRef, useState } from "react";
import Decimal from "decimal.js";
import { useLocale, useTranslations } from "next-intl";
import { useEntryBreakdown } from "@/hooks/payroll/entry/hook.entry";
import { useCompensationField } from "@/hooks/payroll/fields/hook.compensation";
import { useOTFields } from "@/hooks/payroll/fields/hook.ot";
import { usePenaltyFields } from "@/hooks/payroll/fields/hook.penalty";
import { calculateOT } from "@/lib/otCalculater";
import { calculatePenalty } from "@/lib/penaltyCalculater";
import { getLocalizedName } from "@/lib/getLocalizedName";
import { COMPEN_FIELD_DEFINATION_TYPE as CompensationType } from "@/types/enum/enum.compensation";
import { PAY_PERIOD_STATUS } from "@/types/enum/enum.period";
import type { EntryBreakDownDTO, EntryWithTotalDTO, LineChange, OneOffPayrollLine, UpdateBreakDownDTO } from "@/types/type.entry";
import type { PeriodPublicDTO } from "@/types/type.period";
import { TextArea } from "@/widget/Input";
import PayrollSummaryTab from "./PayrollSummaryTab";
import PayrollTable from "./PayrollTable";
import OneOffPayrollField from "./OneOffPayrollField";

interface PayrollEditEmployeeModalProps {
  periodData?: PeriodPublicDTO;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedRecord: EntryWithTotalDTO | null;
}

type Group = keyof UpdateBreakDownDTO["items"];
type Field = { id: number; code: string };
type Edits = UpdateBreakDownDTO["entry"] & Partial<Record<Group, Record<string, string>>>;

function mergeRows<Saved extends Field, Definition extends Field>(saved: Saved[], definitions: Definition[]) {
  const savedCodes = new Set(saved.map(({ code }) => code));
  return [
    ...saved.map((row) => ({ ...row, saved: true as const })),
    ...definitions.filter(({ code }) => !savedCodes.has(code)).map((row) => ({ ...row, saved: false as const })),
  ];
}

function lineChanges<Key extends "amount" | "value">(
  edits: Record<string, string> | undefined,
  rows: (Field & { saved: boolean })[],
  key: Key,
) {
  return Object.entries(edits ?? {}).flatMap<LineChange<Key>>(([code, input]) => {
    const row = rows.find((candidate) => candidate.code === code);
    if (!row) throw new Error("Payroll field is no longer available");
    if (row.saved) return [{ id: row.id, [key]: input === "" ? null : input } as { id: number } & Record<Key, string | null>];
    if (input === "") return [];
    return [{ fieldId: row.id, [key]: input } as { fieldId: number } & Record<Key, string>];
  });
}

export default function PayrollEditEmployeeModal({ open, setOpen, periodData, selectedRecord }: PayrollEditEmployeeModalProps) {
  if (!open || !periodData || !selectedRecord) return null;
  return <PayrollEditor key={selectedRecord.id} period={periodData} employee={selectedRecord} close={() => setOpen(false)} />;
}

function PayrollEditor({ period, employee, close }: {
  period: PeriodPublicDTO;
  employee: EntryWithTotalDTO;
  close: () => void;
}) {
  const t = useTranslations("record");
  const locale = useLocale();
  const draft = period.status === PAY_PERIOD_STATUS.DRAFT;
  const { get, update } = useEntryBreakdown(period.id, employee.id);
  const income = useCompensationField(CompensationType.INCOME, draft);
  const deductions = useCompensationField(CompensationType.DEDUCTION, draft);
  const display = useCompensationField(CompensationType.NON_CALCULATED, draft);
  const overtime = useOTFields(draft);
  const penalties = usePenaltyFields(draft);
  const settings = [income, deductions, display, overtime, penalties];
  const loading = get.isPending || (draft && settings.some((query) => query.isPending));
  const loadFailed = get.isError || (draft && settings.some((query) => query.isError));
  const [edits, setEdits] = useState<Edits>({});
  const pending = useRef<Edits>({});
  const inFlight = useRef<Promise<EntryBreakDownDTO> | null>(null);
  const adding = useRef(false);
  const [addingLine, setAddingLine] = useState(false);
  const [status, setStatus] = useState<"saved" | "changed" | "uploading" | "failed">("saved");
  const [closing, setClosing] = useState(false);
  const breakdown = get.data?.data;

  function rowsFor(data: NonNullable<typeof breakdown>) {
    const savedCodes = new Set([
      ...data.items.earnings, ...data.items.deductions, ...data.items.non_calculated,
    ].map(({ code }) => code));
    return {
      earnings: mergeRows(data.items.earnings, (income.data?.data ?? []).filter(({ code }) => !savedCodes.has(code))),
      deductions: mergeRows(data.items.deductions, (deductions.data?.data ?? []).filter(({ code }) => !savedCodes.has(code))),
      non_calculated: mergeRows(data.items.non_calculated, (display.data?.data ?? []).filter(({ code }) => !savedCodes.has(code))),
      ots: mergeRows(data.items.ots, overtime.data?.data ?? []),
      penalties: mergeRows(data.items.penalties, penalties.data?.data ?? []),
    };
  }

  function change(next: Edits) {
    pending.current = next;
    setEdits(next);
    setStatus("changed");
  }

  function changeLine(group: Group, code: string, value: string) {
    change({ ...pending.current, [group]: { ...pending.current[group], [code]: value } });
  }

  function changeEntry(key: "salary" | "note", value: string) {
    change({ ...pending.current, [key]: value });
  }

  function save(initial = breakdown, oneOffLine?: OneOffPayrollLine) {
    if (inFlight.current) return inFlight.current;
    if (!initial || !draft) return Promise.reject(new Error("Payroll is unavailable"));
    if (!oneOffLine && !Object.keys(pending.current).length) return Promise.resolve(initial);

    const flush = async () => {
      let current = initial;

      setStatus("uploading");
      try {
        do {
          const submitted = pending.current;
          const rows = rowsFor(current);
          const response = await update.mutateAsync({ payload: {
            oneOffLine,
            entry: { salary: submitted.salary === "" ? "0" : submitted.salary, note: submitted.note },
            items: {
              earnings: lineChanges(submitted.earnings, rows.earnings, "amount"),
              deductions: lineChanges(submitted.deductions, rows.deductions, "amount"),
              non_calculated: lineChanges(submitted.non_calculated, rows.non_calculated, "amount"),
              ots: lineChanges(submitted.ots, rows.ots, "value"),
              penalties: lineChanges(submitted.penalties, rows.penalties, "value"),
            },
          } });
          if (!response.data) throw new Error("Missing saved payroll entry");
          current = response.data;

          const remaining: Edits = {};
          for (const key of ["salary", "note"] as const) {
            if (pending.current[key] !== submitted[key]) remaining[key] = pending.current[key];
          }
          for (const group of ["earnings", "deductions", "non_calculated", "ots", "penalties"] as const) {
            const newer = Object.fromEntries(Object.entries(pending.current[group] ?? {})
              .filter(([code, value]) => submitted[group]?.[code] !== value));
            if (Object.keys(newer).length) remaining[group] = newer;
          }
          pending.current = remaining;
          setEdits(remaining);
        } while (!oneOffLine && Object.keys(pending.current).length);
        setStatus(Object.keys(pending.current).length ? "changed" : "saved");
        return current;
      } catch (error) {
        setStatus("failed");
        throw error;
      }
    };
    inFlight.current = flush().finally(() => { inFlight.current = null; });
    return inFlight.current;
  }

  async function addLine(line: OneOffPayrollLine) {
    if (adding.current) throw new Error("A payroll field is being added");
    adding.current = true;
    setAddingLine(true);
    try {
      const latest = inFlight.current ? await inFlight.current : breakdown;
      await save(latest, line);
    } finally {
      adding.current = false;
      setAddingLine(false);
    }
  }

  useEffect(() => {
    if (status !== "changed" || loading || loadFailed || closing || addingLine) return;
    const timer = setTimeout(() => { void save().catch(() => {}); }, 1000);
    return () => clearTimeout(timer);
  });

  async function done() {
    if (adding.current) return;
    if (inFlight.current === null && !Object.keys(pending.current).length) {
      close();
      return;
    }
    setClosing(true);
    try {
      await save();
      close();
    } catch {
      setClosing(false);
    }
  }

  const rows = breakdown && rowsFor(breakdown);
  const salary = edits.salary ?? breakdown?.entry.salary ?? "";
  const hourPerDay = new Decimal(period.work_hours_per_day);
  const workDays = new Decimal(period.workdays_per_month);
  const tableProps = (group: Group) => ({
    renderName: (row: { name: string; nameEng: string }) => getLocalizedName(row, locale),
    changes: edits[group] ?? {},
    disabled: !draft || closing,
  });

  return (
    <Modal open onClose={() => { if (!closing) void done(); }}>
      <ModalDialog sx={{ background: "#fafafa", maxHeight: "90dvh", width: "min(640px, calc(100vw - 24px))" }}>
        <div className="flex justify-between gap-4">
          <p>{t("edit.label")}</p>
          <p role="status" className="text-sm">{t(`edit.status.${status}`)}</p>
        </div>
        <p className="text-3xl font-bold">
          {employee.employee.snapshot.firstName} {employee.employee.snapshot.lastName}
        </p>
        {loading && <p>{t("edit.load.loading")}</p>}
        {loadFailed && <p role="alert">{t("edit.status.failed")}</p>}
        {rows && !loading && !loadFailed && (
          <>
            <Box sx={{ minHeight: 0, overflowY: "auto" }} className="bg-white p-4 rounded-sm shadow-sm w-full">
              <Tabs aria-label={t("edit.label")} defaultValue={0}>
                <TabList tabFlex="auto" disableUnderline sx={{
                  [`& .${tabClasses.root}`]: { fontSize: "sm", fontWeight: "lg", minWidth: 0 },
                }}>
                  <Tab color="success">{t("edit.tabs.income")}</Tab>
                  <Tab color="danger">{t("edit.tabs.deduction")}</Tab>
                  <Tab>{t("edit.tabs.overtime")}</Tab>
                  <Tab>{t("edit.tabs.absent")}</Tab>
                  <Tab>{t("edit.tabs.display_only")}</Tab>
                  <Tab color="warning">{t("edit.tabs.summary")}</Tab>
                </TabList>
                <TabPanel keepMounted value={0}>
                  <PayrollTable {...tableProps("earnings")} data={rows.earnings}
                    onChange={(code, value) => changeLine("earnings", code, value)}
                    renderInput={(row) => row.saved ? row.amount : ""}
                    salary={{ value: salary, onChange: (value) => changeEntry("salary", value) }} />
                  {draft && <OneOffPayrollField group="earnings" salary={salary}
                    hoursPerDay={hourPerDay} workDays={workDays} disabled={closing || addingLine} onAdd={addLine} />}
                </TabPanel>
                <TabPanel keepMounted value={1}>
                  <PayrollTable {...tableProps("deductions")} data={rows.deductions}
                    onChange={(code, value) => changeLine("deductions", code, value)}
                    renderInput={(row) => row.saved ? row.amount : ""} />
                  {draft && <OneOffPayrollField group="deductions" salary={salary}
                    hoursPerDay={hourPerDay} workDays={workDays} disabled={closing || addingLine} onAdd={addLine} />}
                </TabPanel>
                <TabPanel keepMounted value={2}>
                  <PayrollTable {...tableProps("ots")} data={rows.ots}
                    onChange={(code, value) => changeLine("ots", code, value)}
                    renderInput={(row) => row.saved ? row.value : ""}
                    calculateAmount={(row, value) => !draft && row.saved ? Number(row.amount) : calculateOT(
                      new Decimal(salary || 0), value, row.type, row.method, hourPerDay, workDays, row.multiplier, row.fixedAmount,
                    )} />
                  {draft && <OneOffPayrollField group="ots" salary={salary}
                    hoursPerDay={hourPerDay} workDays={workDays} disabled={closing || addingLine} onAdd={addLine} />}
                </TabPanel>
                <TabPanel keepMounted value={3}>
                  <PayrollTable {...tableProps("penalties")} data={rows.penalties}
                    onChange={(code, value) => changeLine("penalties", code, value)}
                    renderInput={(row) => row.saved ? row.value : ""}
                    calculateAmount={(row, value) => !draft && row.saved ? Number(row.amount) : calculatePenalty(
                      new Decimal(salary || 0), value, row.type, row.method, hourPerDay, workDays, row.fixedAmount,
                    )} />
                  {draft && <OneOffPayrollField group="penalties" salary={salary}
                    hoursPerDay={hourPerDay} workDays={workDays} disabled={closing || addingLine} onAdd={addLine} />}
                </TabPanel>
                <TabPanel keepMounted value={4}>
                  <PayrollTable {...tableProps("non_calculated")} data={rows.non_calculated}
                    onChange={(code, value) => changeLine("non_calculated", code, value)}
                    renderInput={(row) => row.saved ? row.amount : ""} showFooter={false} />
                  {draft && <OneOffPayrollField group="non_calculated" salary={salary}
                    hoursPerDay={hourPerDay} workDays={workDays} disabled={closing || addingLine} onAdd={addLine} />}
                </TabPanel>
                <TabPanel value={5}>
                  <PayrollSummaryTab periodId={period.id} entryId={employee.id} />
                </TabPanel>
              </Tabs>
            </Box>
            <div className="bg-white p-3 rounded-sm shadow-sm">
              <p className="font-bold text-lg">{t("fields.note")}</p>
              <TextArea value={edits.note ?? breakdown?.entry.note ?? ""} disabled={!draft || closing}
                onChange={(event) => changeEntry("note", event.target.value)} />
            </div>
          </>
        )}
        <Button loading={closing} disabled={addingLine} onClick={() => void done()}>{t("edit.actions.done")}</Button>
      </ModalDialog>
    </Modal>
  );
}
