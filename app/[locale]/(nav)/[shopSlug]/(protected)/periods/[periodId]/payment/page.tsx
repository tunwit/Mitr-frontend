"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDebounce } from "use-debounce";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileDown,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Breadcrumbs from "@/widget/Breadcrumbs";
import AdvancedFilters from "@/widget/payroll/AdvancedFilters";
import PaymentCard from "@/app/components/Payrolls/payment/PaymentCard";
import ScbPaymentPanel from "@/app/components/Payrolls/payment/ScbPaymentPanel";
import { dateFormat, moneyFormat } from "@/utils/formmatter";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { usePeriod } from "@/hooks/payroll/period/hook.period";
import { PAY_PERIOD_STATUS_LABELS } from "@/types/enum/enumLabel";
import { PAY_PERIOD_STATUS } from "@/types/enum/enum";

export default function PaymentPage() {
  const router = useRouter();
  const { periodId } = useParams();
  const pathname = usePathname();
  const { name, slug } = useCurrentShop();
  const tp = useTranslations("payment_payroll");
  const tPeriod = useTranslations("period");
  const tBreadcrumb = useTranslations("breadcrumb");
  const scb = useTranslations("scb");
  const [selectedTab, setSelectedTab] = useState<"manual" | "file">("manual");
  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query, 300);
  const [advancedIds, setAdvancedIds] = useState<number[] | null>(null);
  const {
    data: periodData,
    isLoading,
    isError,
    refetch,
  } = usePeriod(Number(periodId)).getContextWithPayment;
  const period = periodData?.data;
  useEffect(() => {
    if (period?.status === PAY_PERIOD_STATUS.DRAFT)
      router.replace(pathname.replace(/\/payment$/, "/edit"));
  }, [period?.status, pathname, router]);
  const filtered = useMemo(() => {
    const search = debounced.trim().toLowerCase();
    return (period?.breakdowns ?? []).filter(({ entry }) => {
      if (advancedIds && !advancedIds.includes(entry.id)) return false;
      const employee = entry.employee.snapshot;
      return [
        employee.firstName,
        employee.lastName,
        `${employee.firstName} ${employee.lastName}`,
        employee.firstName + employee.lastName,
        employee.nickName,
        employee.branch.name,
        employee.branch.nameEng,
      ].some((value) => value.toLowerCase().includes(search));
    });
  }, [period?.breakdowns, debounced, advancedIds]);

  return (
    <main className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 text-slate-900 selection:bg-blue-100">
      <title>{`${tp("label")} - Mitr`}</title>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
        <Breadcrumbs
          items={[
            { label: name },
            { label: tBreadcrumb("payrolls"), href: `/${slug}/periods` },
            { label: tBreadcrumb("payment_payroll") },
          ]}
        />
        <header className="mt-5 border-b border-slate-200 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {tp("label")}
                </h1>
                {period && (
                  <span className="inline-flex rounded-full bg-slate-200/70 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {tPeriod(
                      `status.${PAY_PERIOD_STATUS_LABELS[period.status]?.toLowerCase()}`,
                    )}
                  </span>
                )}
              </div>
              <p className="mt-2 break-words text-sm text-slate-600">
                {period?.name ?? scb("loading")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <ArrowLeft size={16} aria-hidden />
              {tp("actions.back")}
            </button>
          </div>
          {period && (
            <dl className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <CalendarDays size={16} aria-hidden />
                <dt className="sr-only">{tPeriod("fields.period")}</dt>
                <dd>
                  {dateFormat(new Date(period.start_period))} –{" "}
                  {dateFormat(new Date(period.end_period))}
                </dd>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={16} aria-hidden />
                <dt>{tPeriod("fields.employees")}</dt>
                <dd className="font-medium text-slate-900">
                  {period.employeeCount}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-slate-600">
                  {tPeriod("fields.grand_total")}
                </dt>
                <dd className="font-semibold tabular-nums text-slate-900">
                  ฿{moneyFormat(period.netPay)}
                </dd>
              </div>
            </dl>
          )}
        </header>
        {isLoading && (
          <div
            role="status"
            className="animate-pulse space-y-4 py-8 motion-reduce:animate-none"
          >
            <p>{scb("loading")}</p>
            <div className="h-14 rounded-lg bg-slate-200" />
            <div className="h-48 rounded-xl bg-slate-200/60" />
          </div>
        )}
        {isError && (
          <div role="alert" className="py-8 text-red-700">
            {scb("loadError")}{" "}
            <button onClick={() => refetch()} className="underline">
              {scb("retry")}
            </button>
          </div>
        )}
        {period && (
          <>
            <div
              className="mt-6 flex gap-1 border-b border-slate-200"
              role="tablist"
              aria-label={tp("label")}
            >
              {(["manual", "file"] as const).map((tab) => {
                const Icon = tab === "manual" ? CreditCard : FileDown;
                const selected = selectedTab === tab;
                return (
                  <button
                    type="button"
                    key={tab}
                    id={`payment-tab-${tab}`}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`payment-panel-${tab}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setSelectedTab(tab)}
                    onKeyDown={(event) => {
                      if (
                        ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                          event.key,
                        )
                      ) {
                        event.preventDefault();
                        const next =
                          event.key === "Home"
                            ? "manual"
                            : event.key === "End"
                              ? "file"
                              : tab === "manual"
                                ? "file"
                                : "manual";
                        setSelectedTab(next);
                        document.getElementById(`payment-tab-${next}`)?.focus();
                      }
                    }}
                    className={`-mb-px inline-flex items-center gap-2.5 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${selected ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}
                  >
                    <Icon size={18} aria-hidden />
                    {tp(
                      tab === "manual"
                        ? "tabs.manual.label"
                        : "tabs.generate.label",
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-slate-600">
              {tp(
                selectedTab === "manual"
                  ? "tabs.manual.description"
                  : "tabs.generate.description",
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:max-w-md focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                <Search
                  size={18}
                  className="shrink-0 text-slate-500"
                  aria-hidden
                />
                <span className="sr-only">{tPeriod("search.placeholder")}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={tPeriod("search.placeholder")}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                />
              </label>
              <button
                type="button"
                aria-expanded={showFilter}
                aria-controls="payment-filters"
                onClick={() => setShowFilter(!showFilter)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 ${showFilter ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
              >
                <SlidersHorizontal size={16} aria-hidden />
                {tPeriod("filters.label")}
              </button>
            </div>
            <div id="payment-filters">
              <AdvancedFilters
                periodId={Number(periodId)}
                show={showFilter}
                setShow={setShowFilter}
                context={period}
                onApply={(rows) =>
                  setAdvancedIds(rows.map((row) => row.entry.id))
                }
              />
            </div>
            <section
              id="payment-panel-file"
              role="tabpanel"
              aria-labelledby="payment-tab-file"
              hidden={selectedTab !== "file"}
            >
              <ScbPaymentPanel
                key={String(periodId)}
                periodId={Number(periodId)}
                entries={period.breakdowns}
                visibleIds={filtered.map((row) => row.entry.id)}
                active={selectedTab === "file"}
              />
            </section>
            <section
              id="payment-panel-manual"
              role="tabpanel"
              aria-labelledby="payment-tab-manual"
              hidden={selectedTab !== "manual"}
              className="mt-5 space-y-3 pb-10"
            >
              {filtered.map((row) => (
                <PaymentCard
                  key={row.entry.id}
                  periodId={Number(periodId)}
                  breakdown={row}
                  paymentDetails={period.paymentsByEntryId[row.entry.id]}
                />
              ))}
              {!filtered.length && (
                <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-600">
                  {scb("empty")}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
