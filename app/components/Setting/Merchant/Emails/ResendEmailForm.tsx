import { useUpdateShop } from "@/hooks/hook.shop";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useZodForm } from "@/lib/useZodForm";
import { ResendEmailConfigForm } from "@/schemas/email/emailConfigForm";
import { SEND_EMAIL_METHOD, ShopConfigDTO } from "@/types/type.shop";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { InputForm } from "@/widget/InputForm";
import { Button } from "@mui/joy";
import { useTranslations } from "next-intl";
import { FormProvider } from "react-hook-form";

export default function ResendEmailForm({ shopData }: { shopData: ShopConfigDTO }) {
  const { id: shopId } = useCurrentShop();
  const t = useTranslations("shops");
  const { mutateAsync: updateShop } = useUpdateShop();

  const methods = useZodForm(ResendEmailConfigForm, {
    defaultValues: {
      emailName: shopData.emailName ?? "",
      emailAddress: shopData.emailAddress ?? "",
      resend_api_key: "",
    },
  });
  const { handleSubmit, control, setValue, formState: { isSubmitting } } = methods;

  return (
    <FormProvider {...methods}>
      <form
        className="flex w-[70%] flex-col gap-2 lg:w-[50%]"
        onSubmit={handleSubmit(async (data) => {
          if (!shopId) return;
          try {
            await updateShop({
              shopId,
              payload: {
                ...data,
                resend_api_key: data.resend_api_key || undefined,
                send_email_method: SEND_EMAIL_METHOD.RESEND,
              },
            });
            setValue("resend_api_key", "");
            showSuccess(t("info.email_saved"));
          } catch {
            showError(t("info.email_save_failed"));
          }
        })}
      >
        <InputForm
          control={control}
          name="resend_api_key"
          label={t("fields.resend_api_key")}
          placeHolder={shopData.hasResendApiKey ? t("info.keep_credential") : undefined}
          required={!shopData.hasResendApiKey}
          type="password"
        />
        <InputForm control={control} name="emailName" label={t("fields.email_name")} />
        <InputForm control={control} name="emailAddress" label={t("fields.email_address")} type="email" />
        <Button className="w-fit" loading={isSubmitting} type="submit" variant="outlined">
          {t("actions.save")}
        </Button>
      </form>
    </FormProvider>
  );
}
