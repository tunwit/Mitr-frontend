"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { usePreviewSlip } from "@/hooks/payroll/entry/hook.entry";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function PreviewPage() {
  const { periodId, entryId } = useParams();
  const { name, slug } = useCurrentShop();
  const tb = useTranslations("breadcrumb");
  const revisionId = useSearchParams().get("revisionId") ?? undefined;
  const t = useTranslations("view_payroll.payslips");
  const { data, isPending } = usePreviewSlip(Number(periodId), Number(entryId), revisionId);
  const pdfFrame = useRef<HTMLIFrameElement>(null);
  const pdf = data?.pdf;
  useEffect(() => {
    if (!pdf || !pdfFrame.current) return;
    const url = URL.createObjectURL(pdf);
    pdfFrame.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [pdf]);

  return (
    <main className="page-gutter flex h-full min-w-0 w-full flex-col gap-5 bg-white py-10">
      <title>{t("preview")}</title>
      <Breadcrumbs
        items={[
          { label: name },
          { label: tb("payrolls"), href: `/${slug}/periods` },
          { label: t("preview") },
        ]}
      />
      {pdf ? (
        <iframe ref={pdfFrame} title={t("preview")} className="min-h-0 w-full flex-1" />
      ) : data?.html ? (
        <iframe title={t("preview")} className="min-h-0 w-full flex-1" srcDoc={data.html} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-black">
          <p role="status">{isPending ? t("checking") : t("preview_error")}</p>
        </div>
      )}
    </main>
  );
}
