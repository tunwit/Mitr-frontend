import { TextInput } from "@/widget/Input";
import { useUpdateShop, useVerifyEmailConfig } from "@/hooks/hook.shop";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useZodForm } from "@/lib/useZodForm";
import { SMTPEmailConfigForm } from "@/schemas/email/emailConfigForm";
import { SEND_EMAIL_METHOD, ShopConfigDTO } from "@/types/type.shop";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { InputForm } from "@/widget/InputForm";
import { useUser } from "@clerk/nextjs";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Button, FormControl, FormLabel, Option, Select } from "@mui/joy";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, FormProvider } from "react-hook-form";
import z from "zod";

interface EmailFormProps {
  shopData: ShopConfigDTO;
}

type SMTPFormData = z.infer<typeof SMTPEmailConfigForm>;

export default function SMTPEmailForm({ shopData }: EmailFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [verified, setVerified] = useState(false);
  const { id: shopId } = useCurrentShop();
  const { user } = useUser();
  const t = useTranslations("shops");
  const { mutateAsync: verify } = useVerifyEmailConfig();
  const { mutateAsync: updateShop } = useUpdateShop();

  const methods = useZodForm(SMTPEmailConfigForm, {
    defaultValues: {
      SMTPHost: shopData.SMTPHost || "",
      SMTPPort: shopData.SMTPPort || undefined,
      SMTPSecure: shopData.SMTPSecure ?? true,
      emailName: shopData.emailName || "",
      emailAddress: shopData.emailAddress || "",
      emailPassword: shopData.emailPassword || "",
    },
  });
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = methods;

  const onSubmit = async (data: SMTPFormData) => {
    if (!shopId || !user?.id) return;

    try {
      const result = await verify({
        send_email_method: SEND_EMAIL_METHOD.SMTP,
        ...data,
      });

      setVerifyStatus(result.data?.valid || false);
      setVerifyError(result.data?.error || "Invalid Email config");
      if (!result.data?.valid) return;
    } catch {
      setVerifyStatus(false);
      setVerifyError("Invalid Email config");
    } finally {
      setVerified(true);
    }

    try {
      await updateShop({
        shopId: shopId,
        payload: { ...data, send_email_method: SEND_EMAIL_METHOD.SMTP },
      });
      showSuccess("Save email successfully");
    } catch (err) {
      showError(`Cannot save email ${err}`);
    }
  };
  return (
    <div className="flex flex-col h-full ">
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            handleSubmit(onSubmit)(e);
          }}
          className="flex flex-col gap-2 w-[70%] lg:w-[50%]"
        >
          <div className="flex flex-row flex-wrap gap-4 mt-4">
            <InputForm control={control} name="SMTPHost" label="SMTP Host" />
            <InputForm
              type="number"
              control={control}
              name="SMTPPort"
              label="SMTP Port"
            />

            <FormControl required>
              <FormLabel>
                SMTP Secure
                {errors.SMTPSecure && (
                  <p className="text-xs ml-2 font-normal text-red-500 italic">
                    {errors.SMTPSecure.message}
                  </p>
                )}
              </FormLabel>
              <Controller
                control={control}
                name="SMTPSecure"
                render={({ field }) => (
                  <Select
                    defaultValue={true}
                    onChange={(_, value) => field.onChange(value)}
                  >
                    <Option value={true}>true</Option>
                    <Option value={false}>false</Option>
                  </Select>
                )}
              />
            </FormControl>
          </div>

          <InputForm
            control={control}
            name="emailName"
            label={t("fields.email_name")}
          />
          <InputForm
            control={control}
            name="emailAddress"
            label={t("fields.email_address")}
          />

          <FormControl required>
            <FormLabel>
              {t("fields.email_passkey")}
              {errors.emailPassword && (
                <p className="text-xs ml-2 font-normal text-red-500 italic">
                  {errors.emailPassword.message}
                </p>
              )}
            </FormLabel>
            <Controller
              control={control}
              name="emailPassword"
              render={({ field }) => (
                <TextInput
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  endDecorator={
                    showPassword ? (
                      <Icon
                        icon="mdi:eye"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    ) : (
                      <Icon
                        icon="mdi:eye-off"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    )
                  }
                />
              )}
            />
          </FormControl>
          <div className="w-fit">
            <Button
              loading={isSubmitting}
              disabled={isSubmitting}
              type="submit"
              color="primary"
              variant="outlined"
            >
              {isSubmitting ? "Verifying" : t("actions.save")}
            </Button>
          </div>
        </form>
      </FormProvider>

      <div
        hidden={!verified}
        className="flex flex-col gap-2 justify-end w-full mt-3"
      >
        {verifyStatus ? (
          <section className="w-[50%] bg-green-100 border border-green-600 px-4 py-2 rounded-md">
            <span className="flex flex-row gap-1 items-center">
              <Icon
                className="text-green-700"
                icon="lets-icons:check-fill"
                fontSize={"20"}
              />
              <p className="text-green-700 opacity-70">
                {t("info.valid_email")}
              </p>
            </span>
          </section>
        ) : (
          <section className="w-[50%] bg-red-100 border border-red-600 px-4 py-2 rounded-md">
            <span className="flex flex-row gap-1 items-center">
              <Icon
                className="text-red-700"
                icon="mdi:cross-circle"
                fontSize={"20"}
              />
              <p className="text-red-700 opacity-70">
                {t("info.invalid_email", { err: verifyError })}
              </p>
            </span>
          </section>
        )}
      </div>
    </div>
  );
}
