"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalDialog,
  Radio,
  RadioGroup,
  Sheet,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Typography,
} from "@mui/joy";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useEntry } from "@/hooks/payroll/entry/hook.entry";
import { useEmployeePresets } from "@/hooks/hook.employeePreset";
import EmployeePicker from "@/app/components/Employees/EmployeePicker";
import { getLocalizedName } from "@/lib/getLocalizedName";
import { showSuccess } from "@/utils/showSnackbar";

export default function PayrollsAddEmployeeModal({
  periodId,
  open,
  setOpen,
  onApplied,
}: {
  periodId: number;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onApplied?: () => void;
}) {
  const t = useTranslations("employee_presets");
  const locale = useLocale();
  const { slug } = useCurrentShop();
  const [tab, setTab] = useState<string | number>(0);
  const [employeeIds, setEmployeeIds] = useState<number[]>([]);
  const [presetId, setPresetId] = useState<number | null>(null);
  const [mode, setMode] = useState<"add" | "override">("add");
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [error, setError] = useState(false);
  const { list } = useEmployeePresets(open && tab === 1);
  const { create, applyPreset } = useEntry(periodId);
  const pending = create.isPending || applyPreset.isPending;
  const selectedPreset = list.data?.data?.find(
    (preset) => preset.id === presetId,
  );
  const canSubmit =
    tab === 0
      ? employeeIds.length > 0
      : !!selectedPreset?.employees.length && !list.isError && !list.isFetching;

  const close = () => {
    if (pending) return;
    setOpen(false);
    setEmployeeIds([]);
    setPresetId(null);
    setMode("add");
    setTab(0);
    setConfirmOverride(false);
    setError(false);
  };

  const submit = async () => {
    if (pending || !canSubmit) return;
    if (tab === 1 && mode === "override" && !confirmOverride) {
      setConfirmOverride(true);
      return;
    }
    setError(false);
    try {
      if (tab === 0) await create.mutateAsync({ payload: { employeeIds } });
      else if (selectedPreset)
        await applyPreset.mutateAsync({ presetId: selectedPreset.id, mode });
      showSuccess(t("applied"));
      onApplied?.();
      // Reset explicitly: mutation state can still be pending until the next render.
      setOpen(false);
      setEmployeeIds([]);
      setPresetId(null);
      setMode("add");
      setTab(0);
      setConfirmOverride(false);
    } catch {
      setError(true);
    }
  };

  return (
    <Modal open={open} onClose={close}>
      <ModalDialog
        aria-labelledby="add-payroll-employees-title"
        sx={{
          width: { xs: "calc(100% - 24px)", md: 800 },
          maxWidth: "100%",
          maxHeight: "90dvh",
          overflow: "auto",
        }}
      >
        <Typography id="add-payroll-employees-title" level="h4">
          {t("add_employees")}
        </Typography>
        {error && (
          <Alert color="danger" role="alert">
            {t("apply_failed")}
          </Alert>
        )}
        {confirmOverride ? (
          <Alert color="warning" role="alert">
            <div>
              <Typography fontWeight="lg">{t("override_title")}</Typography>
              <p>
                {t("override_description", {
                  name: selectedPreset?.name ?? "",
                })}
              </p>
            </div>
          </Alert>
        ) : (
          <Tabs
            value={tab}
            onChange={(_, value) => {
              if (value !== null && !pending) {
                setTab(value);
                setError(false);
              }
            }}
          >
            <TabList>
              <Tab disabled={pending}>{t("employees")}</Tab>
              <Tab disabled={pending}>{t("presets")}</Tab>
            </TabList>
            <TabPanel value={0} sx={{ px: 0 }}>
              <EmployeePicker
                value={employeeIds}
                onChange={setEmployeeIds}
                disabled={pending}
              />
            </TabPanel>
            <TabPanel value={1} sx={{ px: 0 }}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm">{t("choose_preset")}</p>
                  <Button
                    component={Link}
                    href={`/${slug}/presets`}
                    variant="plain"
                    size="sm"
                    disabled={pending}
                  >
                    {t("manage")}
                  </Button>
                </div>
                {list.isLoading && <p role="status">{t("loading")}</p>}
                {list.isError && (
                  <Alert
                    color="danger"
                    role="alert"
                    endDecorator={
                      <Button
                        size="sm"
                        variant="plain"
                        color="danger"
                        onClick={() => list.refetch()}
                      >
                        {t("retry")}
                      </Button>
                    }
                  >
                    {t("load_failed")}
                  </Alert>
                )}
                {list.isSuccess && !list.data?.data?.length && (
                  <p className="py-6 text-center text-sm">{t("empty")}</p>
                )}
                {!!list.data?.data?.length && (
                  <>
                    <FormControl disabled={pending || list.isError}>
                      <FormLabel>{t("presets")}</FormLabel>
                      <RadioGroup
                        aria-label={t("choose_preset")}
                        value={presetId === null ? "" : String(presetId)}
                        onChange={(event) =>
                          setPresetId(Number(event.target.value))
                        }
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          maxHeight: 240,
                          overflow: "auto",
                          gap: 1.5,
                          p: 0.5,
                        }}
                      >
                        {list.data.data.map((preset) => (
                          <Sheet
                            key={preset.id}
                            variant="outlined"
                            sx={{
                              position: "relative",
                              minWidth: 0,
                              borderRadius: "md",
                              p: 2,
                              borderColor:
                                presetId === preset.id
                                  ? "primary.outlinedBorder"
                                  : "neutral.outlinedBorder",
                              bgcolor:
                                presetId === preset.id
                                  ? "primary.softBg"
                                  : "background.surface",
                              color:
                                presetId === preset.id
                                  ? "primary.softColor"
                                  : "text.primary",
                              ...(!pending &&
                                !list.isError && {
                                  "&:hover": {
                                    borderColor: "primary.outlinedBorder",
                                    bgcolor: "primary.softHoverBg",
                                  },
                                }),
                            }}
                          >
                            <Radio
                              overlay
                              value={String(preset.id)}
                              label={
                                <span className="flex min-w-0 flex-col gap-1">
                                  <span className="break-words font-semibold">
                                    {preset.name}
                                  </span>
                                  <span className="text-sm">
                                    {t("member_count", {
                                      count: preset.employees.length,
                                    })}
                                  </span>
                                </span>
                              }
                              disabled={pending || list.isError}
                              sx={{
                                alignItems: "flex-start",
                                color: "inherit",
                              }}
                            />
                          </Sheet>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    {selectedPreset && (
                      <div className="border-t border-gray-200 pt-3">
                        <Typography level="title-sm">{t("preview")}</Typography>
                        {!selectedPreset.employees.length && (
                          <p className="text-sm py-3">{t("empty_members")}</p>
                        )}
                        <ul className="max-h-[25vh] overflow-auto divide-y divide-gray-100">
                          {selectedPreset.employees.map((employee) => (
                            <li
                              key={employee.id}
                              className="flex justify-between gap-3 py-2 text-sm"
                            >
                              <span>
                                {employee.firstName} {employee.lastName}
                              </span>
                              <span>
                                {getLocalizedName(employee.branch, locale)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <FormControl disabled={pending}>
                      <FormLabel>{t("apply_mode")}</FormLabel>
                      <RadioGroup
                        orientation="horizontal"
                        value={mode}
                        onChange={(event) =>
                          setMode(
                            event.target.value === "override"
                              ? "override"
                              : "add",
                          )
                        }
                      >
                        <Radio
                          value="add"
                          label={t("add")}
                          disabled={pending}
                        />
                        <Radio
                          value="override"
                          label={t("override")}
                          disabled={pending}
                        />
                      </RadioGroup>
                      <p className="text-sm mt-2">
                        {t(
                          mode === "add"
                            ? "add_description"
                            : "replace_description",
                        )}
                      </p>
                    </FormControl>
                  </>
                )}
              </div>
            </TabPanel>
          </Tabs>
        )}
        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="outlined"
            color="neutral"
            disabled={pending}
            onClick={() =>
              confirmOverride ? setConfirmOverride(false) : close()
            }
          >
            {t("cancel")}
          </Button>
          <Button
            color={tab === 1 && mode === "override" ? "danger" : "primary"}
            loading={pending}
            disabled={!canSubmit || pending}
            onClick={submit}
          >
            {t(tab === 1 && mode === "override" ? "override" : "add")}
          </Button>
        </div>
      </ModalDialog>
    </Modal>
  );
}
