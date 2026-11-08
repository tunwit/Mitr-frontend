"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { Link } from "@/i18n/navigation";
import { Button, Tab, TabList, TabPanel, Tabs, tabClasses } from "@mui/joy";
import { useRouter } from "next/navigation";
import MerchantTabs from "@/app/components/Setting/MerchantTabs";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import SalaraTabs from "@/app/components/Setting/SalaraTabs";
import { useTranslations } from "next-intl";

export default function Page() {
  const rounter = useRouter();
  const { name, slug } = useCurrentShop();
  const tBreadcrumb = useTranslations("breadcrumb");
  const t = useTranslations("setting");
  const tp = useTranslations("employee_presets");

  return (
    <main className="w-full  font-medium max-h-[calc(100vh-200px)]">
      <title>Setting - Mitr</title>
      <div className="mx-10 flex flex-col min-h-screen ">
        <Breadcrumbs
          className="mt-10"
          items={[
            { label: name },
            { label: tBreadcrumb("configure") },
            { label: tBreadcrumb("setting") },
          ]}
        />
        <div className="my-5 flex flex-row justify-between">
          <p className="text-black text-4xl font-bold">{t("label")}</p>
          <Button component={Link} href={`/${slug}/presets`} variant="outlined">
            {tp("presets")}
          </Button>
        </div>

        <Tabs aria-label="Basic tabs" defaultValue={0}>
          <TabList
            sx={{
              [`& .${tabClasses.root}`]: {
                fontSize: "sm",
                fontWeight: "lg",
                [`&[aria-selected="true"]`]: {
                  bgcolor: "background.surface",
                },
                [`&.${tabClasses.focusVisible}`]: {
                  outlineOffset: "-4px",
                },
              },
            }}
          >
            <Tab>{t("tabs.merchant.label")}</Tab>
            <Tab>{t("tabs.salary.label")}</Tab>
            <Tab>{t("tabs.slip.label")}</Tab>
          </TabList>
          <TabPanel value={0}>
            <MerchantTabs />
          </TabPanel>
          <TabPanel value={1}>
            <SalaraTabs />
          </TabPanel>
          <TabPanel value={2}>
            <b>Third</b> tab panel
          </TabPanel>
        </Tabs>
      </div>
    </main>
  );
}
