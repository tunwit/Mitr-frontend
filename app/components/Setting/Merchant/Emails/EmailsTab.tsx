import { useTranslations } from "next-intl";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useShopConfigs } from "@/hooks/hook.shop";
import { Option, Select } from "@mui/joy";
import { useState } from "react";
import { SEND_EMAIL_METHOD } from "@/types/type.shop";
import SMTPEmailForm from "./SMTPEmailForm";
import ResendEmailForm from "./ResendEmailForm";

export default function EmailsTab() {
  const { id: shopId } = useCurrentShop();
  return <ShopEmails key={shopId} />;
}

function ShopEmails() {
  const { data, isLoading } = useShopConfigs();
  const [selectedProvider, setProvider] = useState<SEND_EMAIL_METHOD>();
  const t = useTranslations("shops");
  if (isLoading || !data?.data) return null;
  const provider = selectedProvider ?? data.data.send_email_method;
  return (
    <>
      <div className="-mt-4">
        <h1 className="font-medium text-3xl">{t("tabs.email_config")}</h1>
        <p id="email-provider-label">{t("fields.email_provider")}</p>
        <Select
          className="max-w-40"
          onChange={(e, value) => setProvider(value || SEND_EMAIL_METHOD.SMTP)}
          aria-labelledby="email-provider-label"
          value={provider}
        >
          <Option value="SMTP">SMTP</Option>
          <Option value="RESEND">Resend</Option>
        </Select>
        {provider === SEND_EMAIL_METHOD.RESEND
          ? <ResendEmailForm shopData={data.data} />
          : <SMTPEmailForm shopData={data.data} />}
      </div>
    </>
  );
}
