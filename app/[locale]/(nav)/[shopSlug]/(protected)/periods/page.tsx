"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { SearchInput } from "@/widget/Input";
import Button from "@mui/joy/Button";
import { Icon } from "@iconify/react/dist/iconify.js";
import dayjs from "dayjs";
import { Modal, ModalDialog } from "@mui/joy";
import { Add } from "@mui/icons-material";
import { useState } from "react";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useUser } from "@clerk/nextjs";
import { PAY_PERIOD_STATUS } from "@/types/enum/enum";
import PeriodsTable from "@/app/components/Payrolls/PeriodsTable";
import { useTranslations } from "next-intl";
import { usePeriods } from "@/hooks/payroll/period/hook.period";
import { NewPeriodDTO } from "@/types/type.period";
import { useRouter } from "@/i18n/navigation";

export default function PeriodsPage() {
  const rounter = useRouter();
  const { id, slug } = useCurrentShop();
  const { user } = useUser();
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const { name } = useCurrentShop();
  const periods = usePeriods();
  const { data, isLoading } = periods.list;
  const tb = useTranslations("breadcrumb");
  const t = useTranslations("payrolls");
  const tPeriod = useTranslations("period");

  const newHandler = async () => {
    setCreatingPeriod(true);
    try {
      if (!id || !user?.id) return;
      const payload: NewPeriodDTO = {
        name: `New payroll ${dayjs().format("YYYY-MM-DD")}`,
        start_period: dayjs().format("YYYY-MM-DD"),
        end_period: dayjs().format("YYYY-MM-DD"),
      };

      const period = await periods.create.mutateAsync({ payload });
      if (period.data?.id) {
        rounter.push(`periods/${period.data?.id}/edit`);
      }
    } finally {
      setCreatingPeriod(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-white font-medium">
      <title>Payrolls - Eslip</title>
      <Modal open={isLoading}>
        <ModalDialog>
          <div className="flex flex-col items-center justify-center">
            <Icon
              icon={"mynaui:spinner"}
              className="animate-spin"
              fontSize={50}
            />

            <p>{t("load.loading_payrolls")}</p>
          </div>
        </ModalDialog>
      </Modal>

      <section className="px-10 pb-5 bg-white w-full ">
        <Breadcrumbs
          className="pt-10"
          items={[
            { label: name },
            { label: tb("dashboard") },
            { label: tb("payrolls") },
          ]}
        />
        <div className="mt-5 flex flex-row justify-between">
          <span>
            <p className="text-black text-4xl font-bold">{t("label")}</p>
            <p className=" text-gray-700 mt-2"></p>
          </span>

          <Button
            onClick={newHandler}
            sx={{ height: 40 }}
            startDecorator={<Add sx={{ fontSize: "20px" }} />}
          >
            {t("actions.create")}
          </Button>
        </div>
      </section>

      <div className="mx-10 flex flex-col min-h-screen ">
        <section className=" flex flex-row justify-between bg-white">
          <div className="w-[60%]">
            <SearchInput
              type="text"
              placeholder={t("search.placeholder")}
              className="h-6"
            />
          </div>
        </section>

        <section className="mt-5 space-y-5">
          {data?.data &&
            data?.data?.filter(
              (period) => period.status === PAY_PERIOD_STATUS.DRAFT,
            ).length > 0 && (
              <PeriodsTable
                title={tPeriod("status.draft")}
                color="gray"
                periods={
                  data?.data?.filter(
                    (period) => period.status === PAY_PERIOD_STATUS.DRAFT,
                  ) || []
                }
              />
            )}
          {data?.data &&
            data?.data?.filter(
              (period) => period.status === PAY_PERIOD_STATUS.FINALIZED,
            ).length > 0 && (
              <PeriodsTable
                title={tPeriod("status.finalized")}
                color="green"
                editable={false}
                periods={
                  data?.data?.filter(
                    (period) => period.status === PAY_PERIOD_STATUS.FINALIZED,
                  ) || []
                }
              />
            )}
          {data?.data &&
            data?.data?.filter(
              (period) => period.status === PAY_PERIOD_STATUS.PAID,
            ).length > 0 && (
              <PeriodsTable
                title={tPeriod("status.paid")}
                color="grey"
                editable={false}
                periods={
                  data?.data?.filter(
                    (period) => period.status === PAY_PERIOD_STATUS.PAID,
                  ) || []
                }
              />
            )}
        </section>
      </div>
    </main>
  );
}
