"use client";

import { Checkbox } from "@mui/joy";
import { useTranslations } from "next-intl";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ZodForm } from "@/lib/useZodForm";
import { updateEmployeeFormSchema } from "@/types/formField";
import { InputForm } from "@/widget/InputForm";

export default function SocialSecurityFields() {
  const { control, setValue } = useFormContext() as ZodForm<
    typeof updateEmployeeFormSchema
  >;
  const t = useTranslations("employees.fields");
  const haveSocialSecurity = useWatch({ control, name: "haveSocialSecurity" });

  return (
    <div className="col-span-full grid items-center gap-3 sm:grid-cols-2">
      <Controller
        name="haveSocialSecurity"
        control={control}
        render={({ field }) => (
          <Checkbox
            name={field.name}
            checked={field.value ?? false}
            onChange={(event) => {
              const checked = event.target.checked;
              field.onChange(checked);
              if (!checked) {
                setValue("socialSecurityNumber", "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
            slotProps={{ input: { ref: field.ref, onBlur: field.onBlur } }}
            label={t("have_social_security")}
          />
        )}
      />
      {haveSocialSecurity && (
        <InputForm
          control={control}
          name="socialSecurityNumber"
          label={t("social_security_number")}
          placeHolder=""
        />
      )}
    </div>
  );
}
