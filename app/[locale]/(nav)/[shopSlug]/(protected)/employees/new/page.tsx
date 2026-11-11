"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import CreateStepper from "@/app/components/Employees/new/CreateStepper";
import { useState } from "react";
import FormSection from "@/app/components/Employees/new/FormSection";
import { useTranslations } from "next-intl";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";

export default function Home() {
  const [currentPage, setCurrentPage] = useState(0);
  const tb = useTranslations("breadcrumb");
  const tn = useTranslations("new_employees");
  const t = useTranslations("employees");
  const { name } = useCurrentShop();

  return (
    <main className="min-h-screen w-full bg-white font-medium">
      <div className="page-gutter py-10">
        <Breadcrumbs
          items={[
            { label: name },
            { label: tb("dashboard") },
            { label: tb("employees") },
            { label: t("actions.create") },
          ]}
        />

        <div className=" mt-5 flex flex-row justify-between mb-8">
          <p className="text-black text-4xl font-bold">{tn("label")}</p>
        </div>

        <CreateStepper current={currentPage} />
        <div className="lg:mx-20">
          <FormSection
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
    </main>
  );
}
