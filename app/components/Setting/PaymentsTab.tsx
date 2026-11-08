"use client";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShopConfigs, useUpdateShop } from "@/hooks/hook.shop";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import {
  scbSettingsSchema,
  type ScbSettingsFormValues,
} from "@/schemas/setting/scbSettingsForm";
import type { ScbSettings, ShopPaymentAccount } from "@/types/type.scb";

export default function PaymentsTab() {
  const t = useTranslations("scb");
  const config = useShopConfigs();
  if (config.isLoading) return <p role="status">{t("loading")}</p>;
  if (config.isError)
    return (
      <p role="alert">
        {t("loadError")}{" "}
        <button onClick={() => config.refetch()}>{t("retry")}</button>
      </p>
    );
  const settings = config.data?.data?.scbPaymentSettings ?? null;
  const accounts = config.data?.data?.paymentAccounts ?? [];
  return (
    <ScbSettingsForm
      key={JSON.stringify([settings, accounts])}
      settings={settings}
      accounts={accounts}
    />
  );
}

function ScbSettingsForm({
  settings,
  accounts,
}: {
  settings: ScbSettings | null;
  accounts: ShopPaymentAccount[];
}) {
  const t = useTranslations("scb");
  const { id: shopId } = useCurrentShop();
  const update = useUpdateShop();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ScbSettingsFormValues>({
    resolver: zodResolver(scbSettingsSchema),
    defaultValues: {
      scbPaymentSettings: {
        systemReferenceId: settings?.systemReferenceId ?? "",
      },
      paymentAccounts: accounts.length
        ? accounts
        : [{ id: "default", label: "", accountNumber: "", isPrimary: true }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "paymentAccounts",
    keyName: "formKey",
  });
  const watchedAccounts = useWatch({ control, name: "paymentAccounts" });
  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-600";
  return (
    <form
      className="max-w-2xl space-y-5 text-gray-900"
      onSubmit={handleSubmit(async (values) => {
        if (!shopId) return;
        setMessage("");
        try {
          await update.mutateAsync({ shopId, payload: values });
          setMessage(t("saved"));
        } catch {
          setMessage(t("settingsError"));
        }
      })}
    >
      <h2 className="text-xl font-semibold">SCB Business Anywhere</h2>
      <p className="text-sm text-gray-600">{t("settingsHelp")}</p>
      <div>
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="scb-systemReferenceId"
        >
          {t("systemReferenceId")}
        </label>
        <input
          id="scb-systemReferenceId"
          {...register("scbPaymentSettings.systemReferenceId")}
          className={inputClass}
          aria-invalid={!!errors.scbPaymentSettings?.systemReferenceId}
          aria-describedby={
            errors.scbPaymentSettings?.systemReferenceId
              ? "scb-system-error"
              : undefined
          }
        />
        {errors.scbPaymentSettings?.systemReferenceId && (
          <p id="scb-system-error" className="text-sm text-red-700">
            {t(`issues.${errors.scbPaymentSettings.systemReferenceId.message}`)}
          </p>
        )}
      </div>
      <section
        className="border-y border-slate-200 py-5"
        aria-labelledby="scb-accounts-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="scb-accounts-title" className="font-semibold">
            {t("fundingAccounts")}
          </h3>
          <button
            type="button"
            disabled={fields.length >= 42}
            className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
            onClick={() =>
              append({
                id: crypto.randomUUID(),
                label: "",
                accountNumber: "",
                isPrimary: false,
              })
            }
          >
            <Plus size={16} aria-hidden />
            {t("addAccount")}
          </button>
        </div>
        <p className="mb-1 text-sm text-slate-600">{t("primaryHelp")}</p>
        {fields.map((account, index) => {
          const rowErrors = errors.paymentAccounts?.[index];
          const primary = !!watchedAccounts?.[index]?.isPrimary;
          return (
            <fieldset
              key={account.formKey}
              className="space-y-3 border-b border-slate-200 py-5 last:border-b-0 last:pb-0"
            >
              <legend className="sr-only">
                {t("accountNumber", { number: index + 1 })}
              </legend>
              <div className="flex items-center justify-between gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 text-sm ${primary ? "font-medium text-blue-700" : "text-slate-600"}`}
                >
                  <input
                    type="radio"
                    name="primary-account"
                    checked={primary}
                    onChange={() =>
                      fields.forEach((_, row) =>
                        setValue(
                          `paymentAccounts.${row}.isPrimary`,
                          row === index,
                          { shouldDirty: true },
                        ),
                      )
                    }
                    className="h-4 w-4 accent-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600"
                  />
                  {t(primary ? "primaryAccount" : "setPrimary")}
                </label>
                <button
                  type="button"
                  disabled={fields.length === 1}
                  aria-label={t("removeNamedAccount", { number: index + 1 })}
                  className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                  onClick={() => {
                    if (primary)
                      setValue(
                        `paymentAccounts.${index === 0 ? 1 : 0}.isPrimary`,
                        true,
                        { shouldDirty: true },
                      );
                    remove(index);
                  }}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["label", "accountNumber"] as const).map((field) => {
                  const error = rowErrors?.[field];
                  return (
                    <div key={field}>
                      <label
                        htmlFor={`scb-${account.id}-${field}`}
                        className="mb-1 block text-sm font-medium"
                      >
                        {t(
                          field === "label"
                            ? "accountLabel"
                            : "bankAccountNumber",
                        )}
                      </label>
                      <input
                        id={`scb-${account.id}-${field}`}
                        {...register(`paymentAccounts.${index}.${field}`)}
                        className={inputClass}
                        inputMode={field === "label" ? "text" : "numeric"}
                        aria-invalid={!!error}
                        aria-describedby={
                          error ? `scb-${account.id}-${field}-error` : undefined
                        }
                      />
                      {error && (
                        <p
                          id={`scb-${account.id}-${field}-error`}
                          className="mt-1 text-xs text-red-700"
                        >
                          {t(`issues.${error.message}`)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
        {(errors.paymentAccounts?.message ||
          errors.paymentAccounts?.root?.message) && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {t("issues.FUNDING_ACCOUNT")}
          </p>
        )}
      </section>
      <button
        disabled={update.isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {update.isPending ? t("saving") : t("save")}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
