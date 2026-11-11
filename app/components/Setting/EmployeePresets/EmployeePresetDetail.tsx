"use client";

import { useState } from "react";
import { Alert, Button, Modal, ModalDialog, Typography } from "@mui/joy";
import Add from "@mui/icons-material/Add";
import { useLocale, useTranslations } from "next-intl";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import {
  useEmployeePreset,
  useEmployeePresets,
} from "@/hooks/hook.employeePreset";
import { useRouter } from "@/i18n/navigation";
import { EmployeePresetDTO } from "@/types/type.employeePreset";
import { useZodForm } from "@/lib/useZodForm";
import { employeePresetSchema } from "@/schemas/setting/employeePresetForm";
import { getLocalizedName } from "@/lib/getLocalizedName";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { InputForm } from "@/widget/InputForm";
import TableWithCheckBox from "@/widget/TableWIthCheckbox";
import EmployeePicker from "@/app/components/Employees/EmployeePicker";
import ChangableAvatar from "@/widget/ChangableAvatar";

export default function EmployeePresetDetail({
  presetId,
}: {
  presetId?: number;
}) {
  const t = useTranslations("employee_presets");
  const tb = useTranslations("breadcrumb");
  const { id: shopId, slug, name } = useCurrentShop();
  const router = useRouter();
  const preset = useEmployeePreset(presetId);
  const isNew = presetId === undefined;
  const invalidId =
    !isNew && (!Number.isSafeInteger(presetId) || presetId <= 0);
  const title = t(isNew ? "create" : "edit");

  return (
    <main className="h-full min-h-0 min-w-0 w-full overflow-y-auto bg-white font-medium">
      <title>{title} - Mitr</title>
      <section className="page-gutter pt-10 pb-5">
        <Breadcrumbs
          items={[
            { label: name },
            { label: tb("dashboard") },
            { label: tb("payrolls"), href: `/${slug}/periods` },
            { label: t("presets"), href: `/${slug}/presets` },
            { label: title },
          ]}
        />
        <h1 className="mt-5 text-black text-4xl font-bold">{title}</h1>
      </section>
      <section className="page-gutter pb-10">
        {!isNew && !invalidId && preset.isPending && (
          <p role="status">{t("loading")}</p>
        )}
        {!isNew &&
          (invalidId ||
            preset.isError ||
            (preset.isSuccess && !preset.data?.data)) && (
            <Alert
              color="danger"
              role="alert"
              endDecorator={
                !invalidId && (
                  <Button
                    color="danger"
                    variant="plain"
                    onClick={() => preset.refetch()}
                  >
                    {t("retry")}
                  </Button>
                )
              }
            >
              {invalidId ? t("not_found") : t("load_failed")}
            </Alert>
          )}
        {(isNew || (!invalidId && preset.isSuccess && preset.data?.data)) && (
          <EmployeePresetForm
            key={`${shopId}-${presetId ?? "new"}`}
            preset={isNew ? undefined : preset.data?.data}
            onClose={() => router.push(`/${slug}/presets`)}
          />
        )}
      </section>
    </main>
  );
}

function EmployeePresetForm({
  preset,
  onClose,
}: {
  preset?: EmployeePresetDTO;
  onClose: () => void;
}) {
  const t = useTranslations("employee_presets");
  const te = useTranslations("employees");
  const locale = useLocale();
  const { save } = useEmployeePresets(false);
  const [error, setError] = useState(false);
  const [employees, setEmployees] = useState<EmployeePresetDTO["employees"]>(
    preset?.employees ?? [],
  );
  const [selecting, setSelecting] = useState(false);
  const { control, handleSubmit, setValue } = useZodForm(
    employeePresetSchema({
      nameRequired: t("name_required"),
      nameTooLong: t("name_too_long"),
    }),
    {
      defaultValues: {
        name: preset?.name ?? "",
        employeeIds: preset?.employees.map((employee) => employee.id) ?? [],
      },
    },
  );
  const updateEmployees = (next: EmployeePresetDTO["employees"]) => {
    setEmployees(next);
    setValue(
      "employeeIds",
      next.map((employee) => employee.id),
      { shouldDirty: true, shouldValidate: true },
    );
  };
  const submit = handleSubmit(async (payload) => {
    if (save.isPending) return;
    setError(false);
    try {
      await save.mutateAsync({ id: preset?.id, payload });
      onClose();
    } catch {
      setError(true);
    }
  });

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-6">
        {error && (
          <Alert color="danger" role="alert">
            {t("save_failed")}
          </Alert>
        )}
        <div className="max-w-xl">
          <InputForm
            control={control}
            name="name"
            label={t("name")}
            disabled={save.isPending}
          />
        </div>
        <section aria-labelledby="preset-employees-title" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="preset-employees-title" className="font-semibold">
              {t("selected_employees", { count: employees.length })}
            </h2>
            <Button
              type="button"
              variant="outlined"
              size="sm"
              startDecorator={<Add />}
              disabled={save.isPending}
              onClick={() => setSelecting(true)}
            >
              {t("add_employees")}
            </Button>
          </div>
          <TableWithCheckBox
            data={employees}
            isLoading={false}
            isSuccess
            editColumn={false}
            tableLabel={t("employees")}
            emptyLabel={t("no_selected_employees")}
            columns={[
              {
                key: "name",
                label: te("fields.name"),
                render: (employee) => (
                  <span className="whitespace-nowrap pr-4 flex items-center ">
                    <div className="flex flex-row gap-3  items-center">
                      <ChangableAvatar
                        src={employee.avatarUrl || ""}
                        fallbackTitle={employee.firstName.charAt(0)}
                        editable={false}
                      />
                      <div className="flex flex-col gap-[0.5px]">
                        <p>{employee.firstName + " " + employee.lastName}</p>
                        <p className="text-xs opacity-65">{employee.email}</p>
                      </div>
                    </div>
                  </span>
                ),
              },
              {
                key: "nickName",
                label: te("fields.nickname"),
                render: (employee) => (
                  <span className="whitespace-nowrap pr-4">
                    {employee.nickName}
                  </span>
                ),
              },
              {
                key: "branch",
                label: te("fields.branch"),
                render: (employee) => (
                  <span className="whitespace-nowrap pr-4">
                    {getLocalizedName(employee.branch, locale)}
                  </span>
                ),
              },
              {
                key: "actions",
                label: t("actions"),
                render: (employee) => (
                  <Button
                    type="button"
                    size="sm"
                    variant="plain"
                    color="danger"
                    disabled={save.isPending}
                    aria-label={t("remove_employee", {
                      name: `${employee.firstName} ${employee.lastName}`,
                    })}
                    onClick={() =>
                      updateEmployees(
                        employees.filter((member) => member.id !== employee.id),
                      )
                    }
                  >
                    {t("remove")}
                  </Button>
                ),
              },
            ]}
          />
        </section>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outlined"
            color="neutral"
            disabled={save.isPending}
            onClick={onClose}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            loading={save.isPending}
            disabled={save.isPending}
          >
            {t("save")}
          </Button>
        </div>
      </form>
      {selecting && (
        <PresetEmployeeModal
          excludedIds={employees.map((employee) => employee.id)}
          onClose={() => setSelecting(false)}
          onAdd={(added) => {
            updateEmployees([...employees, ...added]);
            setSelecting(false);
          }}
        />
      )}
    </>
  );
}

function PresetEmployeeModal({
  excludedIds,
  onAdd,
  onClose,
}: {
  excludedIds: number[];
  onAdd: (employees: EmployeePresetDTO["employees"]) => void;
  onClose: () => void;
}) {
  const t = useTranslations("employee_presets");
  const [ids, setIds] = useState<number[]>([]);
  const [candidates, setCandidates] = useState<EmployeePresetDTO["employees"]>(
    [],
  );
  return (
    <Modal open onClose={onClose}>
      <ModalDialog
        aria-labelledby="preset-add-employees-title"
        sx={{
          width: { xs: "calc(100% - 24px)", md: 800 },
          maxWidth: "100%",
          maxHeight: "90dvh",
          overflow: "auto",
        }}
      >
        <Typography id="preset-add-employees-title" level="h4">
          {t("add_employees")}
        </Typography>
        <EmployeePicker
          value={ids}
          excludedIds={excludedIds}
          onChange={(nextIds, rows) => {
            setIds(nextIds);
            setCandidates((previous) => [
              ...new Map(
                [...previous, ...rows].map((employee) => [
                  employee.id,
                  employee,
                ]),
              ).values(),
            ]);
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outlined" color="neutral" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            disabled={!ids.length}
            onClick={() =>
              onAdd(candidates.filter((employee) => ids.includes(employee.id)))
            }
          >
            {t("add_employees")}
          </Button>
        </div>
      </ModalDialog>
    </Modal>
  );
}
