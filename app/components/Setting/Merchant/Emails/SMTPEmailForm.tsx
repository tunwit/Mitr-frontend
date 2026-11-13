import { useUpdateShop } from "@/hooks/hook.shop";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useZodForm } from "@/lib/useZodForm";
import { SMTPEmailConfigForm } from "@/schemas/email/emailConfigForm";
import { SEND_EMAIL_METHOD, ShopConfigDTO } from "@/types/type.shop";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { InputForm } from "@/widget/InputForm";
import { Button, FormControl, FormLabel, Option, Select } from "@mui/joy";
import { useTranslations } from "next-intl";
import { Controller, FormProvider } from "react-hook-form";

export default function SMTPEmailForm({ shopData }: { shopData: ShopConfigDTO }) {
  const { id: shopId } = useCurrentShop();
  const t = useTranslations("shops");
  const { mutateAsync: updateShop } = useUpdateShop();

  const methods = useZodForm(SMTPEmailConfigForm, {
    defaultValues: {
      SMTPHost: shopData.SMTPHost ?? "",
      SMTPPort: shopData.SMTPPort ?? 465,
      SMTPSecure: shopData.SMTPSecure ?? true,
      emailName: shopData.emailName ?? "",
      emailAddress: shopData.emailAddress ?? "",
      emailPassword: "",
    },
  });
  const { handleSubmit, control, setValue, setError, watch, formState: { isSubmitting } } = methods;
  const [host, port, secure, login] = watch(["SMTPHost", "SMTPPort", "SMTPSecure", "emailAddress"]);
  const needsPassword = !shopData.hasSmtpPassword ||
    host.trim() !== (shopData.SMTPHost ?? "") || port !== (shopData.SMTPPort ?? 465) ||
    secure !== (shopData.SMTPSecure ?? true) || login.trim() !== (shopData.emailAddress ?? "");

  return (
    <FormProvider {...methods}>
      <form
        className="flex w-[70%] flex-col gap-2 lg:w-[50%]"
        onSubmit={handleSubmit(async (data) => {
          if (!shopId) return;
          const password = data.emailPassword?.trim() ? data.emailPassword : undefined;
          if (needsPassword && !password) {
            setError("emailPassword", { message: t("info.smtp_password_required") });
            return;
          }
          try {
            await updateShop({
              shopId,
              payload: { ...data, emailPassword: password, send_email_method: SEND_EMAIL_METHOD.SMTP },
            });
            setValue("emailPassword", "");
            showSuccess(t("info.email_saved"));
          } catch {
            showError(t("info.email_save_failed"));
          }
        })}
      >
        <div className="mt-4 flex flex-wrap gap-4">
          <InputForm control={control} name="SMTPHost" label={t("fields.smtp_host")} />
          <InputForm control={control} name="SMTPPort" label={t("fields.smtp_port")} type="number" />
          <FormControl>
            <FormLabel id="smtp-tls-label">{t("fields.smtp_tls")}</FormLabel>
            <Controller
              control={control}
              name="SMTPSecure"
              render={({ field }) => (
                <Select
                  aria-labelledby="smtp-tls-label"
                  value={field.value ? "implicit" : "starttls"}
                  onChange={(_, value) => field.onChange(value === "implicit")}
                >
                  <Option value="implicit">TLS</Option>
                  <Option value="starttls">STARTTLS</Option>
                </Select>
              )}
            />
          </FormControl>
        </div>
        <InputForm control={control} name="emailName" label={t("fields.email_name")} />
        <InputForm control={control} name="emailAddress" label={t("fields.email_address")} type="email" />
        <InputForm
          control={control}
          name="emailPassword"
          label={t("fields.email_passkey")}
          placeHolder={needsPassword ? undefined : t("info.keep_credential")}
          required={needsPassword}
          type="password"
        />
        <Button className="w-fit" loading={isSubmitting} type="submit" variant="outlined">
          {t("actions.save")}
        </Button>
      </form>
    </FormProvider>
  );
}
