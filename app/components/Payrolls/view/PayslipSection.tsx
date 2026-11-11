import { useState } from "react";
import { Button, LinearProgress } from "@mui/joy";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslations } from "next-intl";
import type { usePayslipProgress } from "@/hooks/payroll/period/hook.period";
import type { PeriodFilterContextDTO } from "@/types/type.period";
import PaySlipGenerateModal from "./PaySlipGenerateModal";

export default function PayslipSection({
  period,
  generation: { progress, retry, isGenerating },
}: {
  period: PeriodFilterContextDTO;
  generation: ReturnType<typeof usePayslipProgress>;
}) {
  const t = useTranslations("view_payroll.payslips");
  const [openRevision, setOpenRevision] = useState<number | null>();
  const status = progress.data?.data;
  const failed = status && status.failed > 0 && !isGenerating;
  const ready = !progress.isError && (status === null || (status && status.ready === status.total));

  return (
    <section className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="rounded-lg bg-blue-100 p-3 text-blue-600" aria-hidden="true">
        <Icon icon="mage:file-3" fontSize={24} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 font-semibold text-gray-900">{t("label")}</h3>
        {progress.isError ? (
          <>
            <p role="alert" className="mb-3 text-sm text-red-700">{t("status_error")}</p>
            <Button size="sm" variant="outlined" onClick={() => void progress.refetch()} loading={progress.isFetching}>
              {t("retry")}
            </Button>
          </>
        ) : failed ? (
          <>
            <p role="alert" className="mb-3 text-sm text-red-700">{t("failed", { count: status.failed })}</p>
            <Button size="sm" variant="outlined" onClick={() => retry.mutate(status.revisionId)} loading={retry.isPending}>
              {t("retry")}
            </Button>
            {retry.isError && <p role="alert" className="mt-2 text-sm text-red-700">{t("retry_error")}</p>}
          </>
        ) : ready ? (
          <>
            <p className="mb-3 text-sm text-gray-600">{t("ready")}</p>
            <Button size="sm" variant="outlined" onClick={() => setOpenRevision(status?.revisionId ?? null)}>
              {t("open")}
            </Button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-600" role="status">
              {status ? t("progress", { ready: status.ready, total: status.total }) : t("checking")}
            </p>
            <LinearProgress
              determinate={!!status}
              value={status?.total ? (status.ready / status.total) * 100 : undefined}
              aria-label={t("label")}
            />
          </>
        )}
      </div>
      {ready && openRevision !== undefined && openRevision === (status?.revisionId ?? null) && (
        <PaySlipGenerateModal
          key={openRevision ?? "legacy"}
          periodContext={period}
          revisionId={openRevision ?? undefined}
          open
          setOpen={() => setOpenRevision(undefined)}
        />
      )}
    </section>
  );
}
