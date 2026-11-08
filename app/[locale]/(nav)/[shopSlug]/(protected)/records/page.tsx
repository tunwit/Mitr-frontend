"use client";
import { useTranslations } from "next-intl";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { SearchInput } from "@/widget/Input";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";

export default function Home() {
  const { name } = useCurrentShop();
  const tb = useTranslations("breadcrumb");

  return (
    <main className="min-h-screen w-full bg-white font-medium">
      <div className="mx-10 flex flex-col min-h-screen ">
        <Breadcrumbs
          className="mt-10"
          items={[
            { label: name },
            { label: tb("dashboard") },
            { label: tb("records") },
          ]}
        />
        <div className="mt-5 flex flex-row justify-between">
          <p className="text-black text-4xl font-bold">Records</p>
        </div>

        <div>card</div>

        <div className="mt-8 flex flex-row gap-2">
          <div className="w-[60%]">
            <p className="text-black text-xs mb-1">Search Payrolls</p>
            <SearchInput type="text" placeholder="Search" />
          </div>

          <div className="w-[20%]">
            <p className="text-black text-xs mb-1">Status</p>
            <Select
              defaultValue="All"
              sx={{ borderRadius: "4px", fontSize: "14px" }}
            >
              <Option value="All">All</Option>
              <Option value="Active">Active</Option>
              <Option value="Part time">Part time</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </div>

          <div className="w-[20%]">
            <p className="text-black text-xs mb-1">Brach</p>
            <Select
              defaultValue="All"
              sx={{ borderRadius: "4px", fontSize: "14px" }}
            >
              <Option value="All">All</Option>
              <Option value="Pakkret">Pakkret</Option>
              <Option value="Ramintra">Ramintra</Option>
              <Option value="Kallapapruk">Kallapapruk</Option>
            </Select>
          </div>
        </div>
      </div>
    </main>
  );
}
