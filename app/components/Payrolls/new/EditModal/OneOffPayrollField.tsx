import { Box, Button, FormControl, FormHelperText, FormLabel, Option, Select, Slider } from "@mui/joy";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import Decimal from "decimal.js";
import { calculateOT } from "@/lib/otCalculater";
import { calculatePenalty } from "@/lib/penaltyCalculater";
import { useZodForm } from "@/lib/useZodForm";
import { OT_METHOD, OT_TYPE } from "@/types/enum/enum.ot";
import { PENALTY_METHOD, PENALTY_TYPE } from "@/types/enum/enum.penalty";
import type { OneOffPayrollLine } from "@/types/type.entry";
import { moneyFormat } from "@/utils/formmatter";
import { TextInput } from "@/widget/Input";

type Group = OneOffPayrollLine["group"];
type Props = {
  group: Group;
  salary: string;
  hoursPerDay: Decimal;
  workDays: Decimal;
  disabled: boolean;
  onAdd: (line: OneOffPayrollLine) => Promise<void>;
};

const decimal = /^-?\d{1,8}(\.\d{1,2})?$/;
const positiveDecimal = /^(?!0+(?:\.0{1,2})?$)\d{1,8}(?:\.\d{1,2})?$/;

export default function OneOffPayrollField(props: Props) {
  const t = useTranslations("record.edit.one_off");
  const [requestId, setRequestId] = useState<string>();
  const close = () => setRequestId(undefined);

  if (requestId) return <OneOffFieldForm {...props} requestId={requestId} close={close} />;
  return (
    <Button
      size="sm"
      variant="plain"
      color="neutral"
      sx={{ mt: 1 }}
      disabled={props.disabled}
      onClick={() => setRequestId(crypto.randomUUID())}
    >
      + {t("add_field")}
    </Button>
  );
}

function OneOffFieldForm({ group, salary, hoursPerDay, workDays, disabled, onAdd, requestId, close }: Props & {
  requestId: string;
  close: () => void;
}) {
  const t = useTranslations("record.edit.one_off");
  const common = useTranslations("confirm_modal.actions");
  const rateLabels = useTranslations(group === "penalties" ? "penalty" : "overtime");
  const overtime = group === "ots";
  const hasRate = overtime || group === "penalties";

  const schema = z.object({
    name: z.string().trim().min(1, t("invalid_name")).max(50, t("invalid_name")),
    input: z.string().regex(decimal, t("invalid_decimal")),
    method: z.nativeEnum(PENALTY_METHOD),
    rate: z.nativeEnum(OT_TYPE),
    fixedAmount: z.string().optional(),
    multiplier: overtime ? z.string().regex(positiveDecimal, t("invalid_rate")) : z.string(),
  }).superRefine((values, context) => {
    if (hasRate && values.rate === OT_TYPE.CONSTANT && !positiveDecimal.test(values.fixedAmount ?? "")) {
      context.addIssue({ code: "custom", path: ["fixedAmount"], message: t("invalid_rate") });
    }
  });
  const { control, handleSubmit, setError, clearErrors, formState } = useZodForm(schema, {
    defaultValues: {
      name: "",
      input: "",
      method: overtime ? PENALTY_METHOD.HOURLY : PENALTY_METHOD.PER_MINUTE,
      rate: OT_TYPE.BASEDONSALARY,
      fixedAmount: "",
      multiplier: "1.5",
    },
  });
  const [input, method, rate, fixedAmount, multiplier] = useWatch({
    control,
    name: ["input", "method", "rate", "fixedAmount", "multiplier"],
  });

  const validPreview = hasRate && decimal.test(input) &&
    (rate !== OT_TYPE.CONSTANT || positiveDecimal.test(fixedAmount ?? "")) &&
    (!overtime || positiveDecimal.test(multiplier));
  const fixedRate = rate === OT_TYPE.CONSTANT ? fixedAmount : null;
  const preview = validPreview && (overtime
    ? calculateOT(new Decimal(salary || 0), Number(input), rate, OT_METHOD[method as keyof typeof OT_METHOD],
      hoursPerDay, workDays, multiplier, fixedRate)
    : calculatePenalty(new Decimal(salary || 0), Number(input), PENALTY_TYPE[rate], method,
      hoursPerDay, workDays, fixedRate));
  const busy = disabled || formState.isSubmitting;

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    const base = { requestId, name: values.name };
    const fixed = values.rate === OT_TYPE.CONSTANT;
    try {
      if (group === "ots") {
        await onAdd({
          ...base, group, value: values.input, multiplier: values.multiplier,
          method: OT_METHOD[values.method as keyof typeof OT_METHOD],
          rate: fixed ? { type: OT_TYPE.CONSTANT, fixedAmount: values.fixedAmount ?? "" } : { type: OT_TYPE.BASEDONSALARY },
        });
      } else if (group === "penalties") {
        await onAdd({
          ...base, group, value: values.input, method: values.method,
          rate: fixed ? { type: PENALTY_TYPE.CONSTANT, fixedAmount: values.fixedAmount ?? "" } : { type: PENALTY_TYPE.BASEDONSALARY },
        });
      } else {
        await onAdd({ ...base, group, amount: values.input });
      }
      close();
    } catch {
      setError("root", { message: t("save_failed") });
    }
  });

  function textField(name: "name" | "input" | "fixedAmount", label: string) {
    return <Controller control={control} name={name} render={({ field, fieldState }) => (
      <TextInput {...field} label={label} errorMessage={fieldState.error?.message}
        slotProps={{ input: { "aria-label": label, inputMode: name === "name" ? "text" : "decimal", autoFocus: name === "name" } }}
        disabled={busy} required />
    )} />;
  }

  return (
    <form onSubmit={submit} noValidate className="mt-3 space-y-3 border-t border-gray-200 pt-3">
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" } }}>
        {textField("name", t("name"))}
        {textField("input", t(hasRate ? "quantity" : "amount"))}
        {hasRate && (
          <>
            <Controller control={control} name="method" render={({ field }) => (
              <FormControl>
                <FormLabel>{t("unit")}</FormLabel>
                <Select {...field} onChange={(_, value) => field.onChange(value)} disabled={busy}>
                  <Option value={PENALTY_METHOD.HOURLY}>{t("hours")}</Option>
                  <Option value={PENALTY_METHOD.DAILY}>{t("days")}</Option>
                  {!overtime && <Option value={PENALTY_METHOD.PER_MINUTE}>{t("minutes")}</Option>}
                </Select>
              </FormControl>
            )} />
            <Controller control={control} name="rate" render={({ field }) => (
              <FormControl>
                <FormLabel>{t("rate_type")}</FormLabel>
                <Select {...field} onChange={(_, value) => field.onChange(value)} disabled={busy}>
                  <Option value={OT_TYPE.BASEDONSALARY}>{rateLabels("type.basedonsalary")}</Option>
                  <Option value={OT_TYPE.CONSTANT}>{rateLabels("type.constant")}</Option>
                </Select>
              </FormControl>
            )} />
            {rate === OT_TYPE.CONSTANT && textField("fixedAmount", t("fixed_rate"))}
            {overtime && (
              <Controller control={control} name="multiplier" render={({ field }) => (
                <FormControl sx={{ px: 1 }}>
                  <FormLabel>{t("multiplier")} · ×{field.value}</FormLabel>
                  <Slider
                    size="sm"
                    variant="soft"
                    aria-label={t("multiplier")}
                    value={Number(field.value)}
                    min={1}
                    max={3}
                    step={0.5}
                    marks={[
                      { value: 1, label: "×1" },
                      { value: 2, label: "×2" },
                      { value: 3, label: "×3" },
                    ]}
                    disabled={busy}
                    onBlur={field.onBlur}
                    onChange={(_, value) => field.onChange(String(value))}
                  />
                </FormControl>
              )} />
            )}
          </>
        )}
      </Box>
      {preview !== false && Number.isFinite(preview) && (
        <p className="text-sm">{t("calculated_amount", { amount: moneyFormat(preview) })}</p>
      )}
      {formState.errors.root && <FormHelperText role="alert" sx={{ color: "danger.plainColor" }}>
        {formState.errors.root.message}
      </FormHelperText>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={formState.isSubmitting} disabled={busy}>{t("add")}</Button>
        <Button type="button" size="sm" variant="plain" color="neutral" disabled={busy} onClick={close}>
          {common("cancel")}
        </Button>
      </div>
    </form>
  );
}
