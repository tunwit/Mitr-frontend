"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { Tab, TabList, TabPanel, Tabs, tabClasses } from "@mui/joy";
import PaymentsTab from "@/app/components/Setting/PaymentsTab";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import MerchantTabs from "@/app/components/Setting/MerchantTabs";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import SalaraTabs from "@/app/components/Setting/SalaraTabs";
import { useTranslations } from "next-intl";

export default function Page() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  );
}

function SettingsPage() {
  const searchParams = useSearchParams();
  const scb = useTranslations("scb");
  const { name } = useCurrentShop();
  const tBreadcrumb = useTranslations("breadcrumb");
  const t = useTranslations("setting");

  return (
    <main className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-white font-medium">
      <title>Setting - Mitr</title>
      <div className="page-gutter flex w-full flex-col py-10">
        <Breadcrumbs
          items={[
            { label: name },
            { label: tBreadcrumb("configure") },
            { label: tBreadcrumb("setting") },
          ]}
        />
        <div className="my-5 flex flex-row justify-between">
          <p className="text-black text-4xl font-bold">{t("label")}</p>
        </div>

        <Tabs
          aria-label="Basic tabs"
          defaultValue={searchParams.get("tab") === "payments" ? 3 : 0}
        >
          <TabList
            sx={{
              flexWrap: "wrap",
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
            <Tab>{scb("payments")}</Tab>
          </TabList>
          <TabPanel value={0}>
            <MerchantTabs />
          </TabPanel>
          <TabPanel value={1}>
            <SalaraTabs />
          </TabPanel>
          <TabPanel value={3}>
            <PaymentsTab />
          </TabPanel>
          <TabPanel value={2}>
            <b>Third</b> tab panel
          </TabPanel>
        </Tabs>
      </div>
    </main>
  );
}
