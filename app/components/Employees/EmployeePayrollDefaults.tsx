"use client";

import {
  Alert,
  Button,
  Dropdown,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
} from "@mui/joy";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { Controller, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useCompensationField } from "@/hooks/payroll/fields/hook.compensation";
import { useEmployeePayrollDefaults } from "@/hooks/hook.employeePayrollDefaults";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { COMPEN_FIELD_DEFINATION_TYPE as Type } from "@/types/enum/enum.compensation";
import { CompensationFieldPublicDTO } from "@/types/payroll/type.compensation";
import { EmployeePayrollDefaultsDTO } from "@/types/type.employee";
import { employeePayrollDefaultsSchema } from "@/schemas/employeePayrollDefaultsForm";
import { useZodForm } from "@/lib/useZodForm";
import { getLocalizedName } from "@/lib/getLocalizedName";
import { TextInput } from "@/widget/Input";
import { showSuccess } from "@/utils/showSnackbar";

export default function EmployeePayrollDefaults({
  employeeId,
  enabled,
}: {
  employeeId: number;
  enabled: boolean;
}) {
  const t = useTranslations("employee_payroll_defaults");
  const { id: shopId } = useCurrentShop();
  const earnings = useCompensationField(Type.INCOME, enabled);
  const deductions = useCompensationField(Type.DEDUCTION, enabled);
  const { list, save } = useEmployeePayrollDefaults(employeeId, enabled);
  const queries = [earnings, deductions, list];
  if (queries.some((query) => query.isError))
    return (
      <Alert
        color="danger"
        role="alert"
        endDecorator={
          <Button
            variant="plain"
            color="danger"
            onClick={() =>
              queries.forEach((query) => {
                void query.refetch();
              })
            }
          >
            {t("retry")}
          </Button>
        }
      >
        {t("load_failed")}
      </Alert>
    );
  if (queries.some((query) => query.isPending))
    return <p role="status">{t("loading")}</p>;
  return (
    <PayrollDefaultsForm
      key={`${shopId}-${employeeId}`}
      earnings={earnings.data?.data ?? []}
      deductions={deductions.data?.data ?? []}
      defaults={list.data?.data ?? { items: [] }}
      save={save}
    />
  );
}

function PayrollDefaultsForm({
  earnings,
  deductions,
  defaults,
  save,
}: {
  earnings: CompensationFieldPublicDTO[];
  deductions: CompensationFieldPublicDTO[];
  defaults: EmployeePayrollDefaultsDTO;
  save: ReturnType<typeof useEmployeePayrollDefaults>["save"];
}) {
  const t = useTranslations("employee_payroll_defaults");
  const locale = useLocale();
  const [error, setError] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    unregister,
    formState: { isDirty },
  } = useZodForm(employeePayrollDefaultsSchema(t("invalid_amount")), {
    defaultValues: {
      amounts: Object.fromEntries(
        defaults.items
          .filter((item) =>
            [...earnings, ...deductions].some(
              (field) => field.id === item.fieldId,
            ),
          )
          .map((item) => [String(item.fieldId), item.amount]),
      ),
    },
  });
  const amounts = useWatch({ control, name: "amounts" });
  const submit = handleSubmit(async ({ amounts }) => {
    if (save.isPending) return;
    setError(false);
    try {
      const response = await save.mutateAsync({
        items: [...earnings, ...deductions]
          .filter((field) => String(field.id) in amounts)
          .map((field) => ({
            fieldId: field.id,
            amount: amounts[String(field.id)] ?? "0",
          })),
      });
      reset({
        amounts: Object.fromEntries(
          response.data?.items.map((item) => [
            String(item.fieldId),
            item.amount,
          ]) ?? [],
        ),
      });
      showSuccess(t("saved"));
    } catch {
      setError(true);
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {error && (
        <Alert color="danger" role="alert">
          {t("save_failed")}
        </Alert>
      )}
      {(
        [
          ["earnings", earnings],
          ["deductions", deductions],
        ] as const
      ).map(([category, fields]) => {
        const selected = fields.filter((field) => String(field.id) in amounts);
        const available = fields.filter(
          (field) => !(String(field.id) in amounts),
        );
        return (
          <section
            key={category}
            aria-labelledby={`payroll-defaults-${category}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <h3 id={`payroll-defaults-${category}`} className="font-semibold">
                {t(category)}
              </h3>
              <Dropdown>
                <MenuButton
                  type="button"
                  variant="plain"
                  color="primary"
                  size="sm"
                  disabled={save.isPending || !available.length}
                  aria-label={t("add_to_category", { category: t(category) })}
                  sx={{ minHeight: 24, px: 0.5, fontSize: "xs" }}
                >
                  + {t("add")}
                </MenuButton>
                <Menu
                  sx={{
                    maxHeight: 240,
                    overflowY: "auto",
                    zIndex: (theme) => theme.zIndex.modal + 1,
                  }}
                >
                  {available.map((field) => (
                    <MenuItem
                      key={field.id}
                      onClick={() =>
                        setValue(
                          "amounts",
                          { ...amounts, [String(field.id)]: "0" },
                          { shouldDirty: true },
                        )
                      }
                    >
                      {getLocalizedName(field, locale)}
                    </MenuItem>
                  ))}
                </Menu>
              </Dropdown>
            </div>
            {!selected.length ? (
              <p className="text-sm text-gray-600">
                {t(fields.length ? "no_defaults" : "empty")}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selected.map((field) => (
                  <div key={field.id} className="flex items-start gap-1">
                    <div className="min-w-0 flex-1">
                      <Controller
                        name={`amounts.${field.id}`}
                        control={control}
                        defaultValue="0"
                        render={({ field: input, fieldState }) => (
                          <TextInput
                            {...input}
                            label={getLocalizedName(field, locale)}
                            errorMessage={fieldState.error?.message}
                            disabled={save.isPending}
                            slotProps={{ input: { inputMode: "decimal" } }}
                            endDecorator={t("currency")}
                          />
                        )}
                      />
                    </div>
                    <IconButton
                      type="button"
                      variant="plain"
                      size="sm"
                      disabled={save.isPending}
                      aria-label={t("remove_field", {
                        name: getLocalizedName(field, locale),
                      })}
                      sx={{ mt: 3 }}
                      onClick={() => {
                        const next = { ...amounts };
                        delete next[String(field.id)];
                        unregister(`amounts.${field.id}`, {
                          keepDefaultValue: true,
                        });
                        setValue("amounts", next, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    >
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || save.isPending}
          loading={save.isPending}
        >
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
