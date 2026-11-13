"use client";

import { FormControl, FormLabel, Option, Select } from "@mui/joy";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { SALARY_PAYMENT_METHODS } from "@/types/enum/enum.employee";
import type { updateEmployeeFormField } from "@/types/formField";

export default function PreferredPaymentMethodField() {
  const { control } = useFormContext<updateEmployeeFormField>();
  const t = useTranslations("employees.preferred_payment_method");

  return (
    <FormControl>
      <FormLabel>{t("label")}</FormLabel>
      <Controller
        control={control}
        name="preferredPaymentMethod"
        render={({ field }) => (
          <Select
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={field.value ?? "unset"}
            onChange={(_, value) => field.onChange(value === "unset" ? null : value)}
          >
            <Option value="unset">{t("unset")}</Option>
            {SALARY_PAYMENT_METHODS.map((method) => (
              <Option key={method} value={method}>{t(method)}</Option>
            ))}
          </Select>
        )}
      />
    </FormControl>
  );
}
