"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { SearchInput } from "@/widget/Input";
import Button from "@mui/joy/Button";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import BranchSelector from "@/widget/BranchSelector";
import StatusSelector from "@/widget/StatusSelector";
import {
  EMPLOYEE_ORDERBY,
  EMPLOYEE_SORTBY,
  EMPLOYEE_STATUS,
} from "@/types/enum/enum";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { EmployeeTableWrapper } from "@/app/components/Employees/EmployeeTableWrapper";
import { useTranslations } from "next-intl";
import OrderByFilter from "@/widget/OrderByFilter";
export default function Home() {
  const rounter = useRouter();
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 500);
  const [branchId, setBranchId] = useState(-1);
  const [status, setStatus] = useState<EMPLOYEE_STATUS | null>(null);
  const [sortBy, setSortBy] = useState<EMPLOYEE_SORTBY>(EMPLOYEE_SORTBY.NAME);
  const [orderBy, setOrderBy] = useState<EMPLOYEE_ORDERBY>(
    EMPLOYEE_ORDERBY.ASC,
  );
  const { name } = useCurrentShop();
  const tb = useTranslations("breadcrumb");
  const t = useTranslations("employees");

  return (
    <>
      <title>Employee - Mitr</title>

      <main className="min-h-screen w-full bg-white font-medium">
        <div className="page-gutter py-10">
          <Breadcrumbs
            items={[
              { label: name },
              { label: tb("dashboard") },
              { label: tb("employees") },
            ]}
          />
          <div className=" mt-5 flex flex-row justify-between">
            <p className="text-black text-4xl font-bold">{t("label")}</p>
            <Button
              onClick={() => rounter.push("employees/new")}
              startDecorator={
                <Icon
                  icon={"material-symbols:add-rounded"}
                  className="text-xl"
                />
              }
              sx={{
                fontSize: "13px",
                "--Button-gap": "5px",
                padding: 1.2,
              }}
            >
              {t("actions.create")}
            </Button>
          </div>

          <div className="mt-8 flex flex-row gap-2">
            <div className="w-[60%]">
              <p className="text-black text-xs mb-1"> {t("search.label")}</p>
              <SearchInput
                type="text"
                placeholder={t("search.placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-6"
              />
            </div>

            <div className="w-[20%]">
              <p className="text-black text-xs mb-1">
                {t("filters.status.label")}
              </p>
              <StatusSelector
                isEnableAll={true}
                status={status}
                onChange={(value) => setStatus(value!)}
              />
            </div>

            <div className="w-[20%]">
              <p className="text-black text-xs mb-1">
                {t("filters.branch.label")}
              </p>
              <BranchSelector
                branchId={branchId}
                onChange={(n) => {
                  if (n) setBranchId(n);
                }}
                isEnableAll={true}
              />
            </div>
            <div className="w-[15%]">
              <p className="text-black text-xs mb-1">
                {t("filters.sort_by.label")}
              </p>
              <OrderByFilter
                value={sortBy}
                onChange={(n) => {
                  if (n) setSortBy(n);
                }}
                choices={EMPLOYEE_SORTBY}
                tPrefix="sort_by"
              />
            </div>
            <div className="w-[15%]">
              <p className="text-black text-xs mb-1">
                {t("filters.order_by.label")}
              </p>
              <OrderByFilter
                value={orderBy}
                onChange={(n) => {
                  if (n) setOrderBy(n);
                }}
                choices={EMPLOYEE_ORDERBY}
                tPrefix="order_by"
              />
            </div>
          </div>
          <div className="flex justify-center mt-5">
            <EmployeeTableWrapper
              key={JSON.stringify([debounced, branchId, status, sortBy, orderBy])}
              sortBy={sortBy}
              orderBy={orderBy}
              search_query={debounced}
              branchId={branchId}
              status={status}
            />
          </div>
        </div>
      </main>
    </>
  );
}
