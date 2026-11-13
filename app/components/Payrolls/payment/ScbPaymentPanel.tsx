"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useShopConfigs } from "@/hooks/hook.shop";
import { useScbPayment } from "@/hooks/payroll/period/hook.scb";
import type { ScbRequest } from "@/types/type.scb";
import type { EntryBreakDownDTO } from "@/types/type.entry";
import Decimal from "decimal.js";
import { moneyFormat } from "@/utils/formmatter";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  Download,
  Info,
  Pencil,
  RefreshCw,
  Users,
} from "lucide-react";
import EmployeeDetailsModal from "@/app/components/Employees/EmployeeDetailsModal";

export default function ScbPaymentPanel({
  periodId,
  entries,
  visibleIds,
  exportScopeIds,
  active,
}: {
  periodId: number;
  entries: EntryBreakDownDTO[];
  visibleIds: number[];
  exportScopeIds: number[] | null;
  active: boolean;
}) {
  const t = useTranslations("scb");
  const paymentMethod = useTranslations("employees.preferred_payment_method");
  const { slug, id: shopId } = useCurrentShop();
  const configs = useShopConfigs();
  const queryClient = useQueryClient();
  const [selection, setSelected] = useState<number[]>(() =>
    entries.filter((row) => !row.entry.paidAt).map((row) => row.entry.id),
  );
  const settings = configs.data?.data?.scbPaymentSettings;
  const accounts = configs.data?.data?.paymentAccounts ?? [];
  const primaryAccountId = accounts.find((account) => account.isPrimary)?.id;
  const [chosenFeeAccountId, setFeeAccountId] = useState<string>();
  const feeAccountId = chosenFeeAccountId ?? primaryAccountId;
  const [chosenAccountId, setFundingAccountId] = useState<string>();
  const fundingAccountId = chosenAccountId ?? primaryAccountId;
  const [exportOptions, setExportOptions] = useState<
    Pick<ScbRequest, "payrollService" | "smartService" | "feePayer">
  >({ feePayer: "OUR" });
  const [paymentDate, setPaymentDate] = useState("");
  const [acknowledgedFingerprint, setAcknowledgedFingerprint] = useState<string>();
  const [editing, setEditing] = useState<number | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const selected = useMemo(() => {
    if (exportScopeIds === null) return selection;
    const scope = new Set(exportScopeIds);
    return selection.filter((id) => scope.has(id));
  }, [selection, exportScopeIds]);
  const request = useMemo(
    () => ({
      entryIds: [...selected].sort((a, b) => a - b),
      paymentDate,
      fundingAccountId,
      feeAccountId,
      ...exportOptions,
    }),
    [selected, paymentDate, fundingAccountId, feeAccountId, exportOptions],
  );
  const { preview, download } = useScbPayment(
    periodId,
    request,
    active && !configs.isLoading && !configs.isError,
  );
  const data = preview.data?.data;
  const preferredMethodsByEntryId = useMemo(
    () =>
      new Map(
        entries.map((row) => [row.entry.id, row.currentPreferredPaymentMethod]),
      ),
    [entries],
  );
  const acknowledgePaid = !!data && acknowledgedFingerprint === data.fingerprint;
  const rows =
    data?.recipients.filter((row) => visibleIds.includes(row.entryId)) ?? [];
  const changeSelection = (ids: number[]) => {
    setSelected(ids);
    setAcknowledgedFingerprint(undefined);
    setDownloaded(false);
    download.reset();
  };
  const buttonClass =
    "rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600";
  const selectedIds = new Set(selected);
  const selectedRows =
    data?.recipients.filter((row) => selectedIds.has(row.entryId)) ?? [];
  const invalidCount = selectedRows.filter(
    (row) => row.issues.length > 0,
  ).length;
  const visibleRows = showIssues
    ? rows.filter((row) => row.issues.length > 0)
    : rows;
  const visibleIssueCount = rows.filter((row) => row.issues.length > 0).length;
  const visibleSelected = visibleRows.filter((row) =>
    selectedIds.has(row.entryId),
  ).length;
  const total = selectedRows.reduce(
    (sum, row) =>
      row.amount && !row.issues.includes("AMOUNT") ? sum.plus(row.amount) : sum,
    new Decimal(0),
  );
  const canDownload =
    !!settings &&
    (!selectedRows.some((row) => row.bankCode === "014") ||
      !!exportOptions.payrollService) &&
    (!selectedRows.some((row) => row.bankCode && row.bankCode !== "014") ||
      !!exportOptions.smartService) &&
    !!data?.ready &&
    !preview.isFetching &&
    !preview.isPlaceholderData &&
    !preview.isError &&
    !download.isPending &&
    (!data.hasPaid || acknowledgePaid);
  return (
    <section
      className="mt-5 grid min-w-0 items-start gap-6 pb-10 xl:grid-cols-[minmax(0,1fr)_320px]"
      aria-label={t("title")}
    >
      <aside
        className="order-first min-w-0 rounded-xl border border-slate-200 bg-white xl:sticky xl:top-6 xl:order-last"
        aria-label={t("exportSummary")}
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold">{t("exportSummary")}</h2>
          <p className="mt-1 text-xs text-slate-600">SCB Business Anywhere</p>
        </div>
        <div className="space-y-5 p-5">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-700">
              {t("paymentDate")}
            </span>
            <input
              type="date"
              value={paymentDate}
              onChange={(event) => {
                setPaymentDate(event.target.value);
                setAcknowledgedFingerprint(undefined);
                setDownloaded(false);
                download.reset();
              }}
              aria-invalid={
                data?.issues.includes("PAYMENT_DATE") && !!paymentDate
              }
              aria-describedby="scb-date-help"
              className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
            />
            <span
              id="scb-date-help"
              className={`mt-2 block text-xs leading-relaxed ${data?.issues.includes("PAYMENT_DATE") && paymentDate ? "text-red-700" : "text-slate-600"}`}
            >
              {t("dateHelp")}
            </span>
          </label>
          <div className="border-y border-slate-200 py-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-600">{t("debitAccount")}</p>
              <Link
                href={`/${slug}/settings?tab=payments`}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 underline-offset-4 hover:underline"
              >
                {t("settingsLink")}
                <ArrowUpRight size={12} aria-hidden />
              </Link>
            </div>
            {settings ? (
              <>
                {(["funding", "fee"] as const).map((kind) => {
                  const value =
                    kind === "funding" ? fundingAccountId : feeAccountId;
                  return (
                    <label key={kind} className="mt-3 block">
                      <span className="mb-1 block text-xs text-slate-600">
                        {t(
                          kind === "funding"
                            ? "fundingAccount"
                            : "feeDebitAccount",
                        )}
                      </span>
                      <select
                        value={value ?? ""}
                        onChange={(event) => {
                          if (kind === "funding")
                            setFundingAccountId(event.target.value);
                          else setFeeAccountId(event.target.value);
                          setAcknowledgedFingerprint(undefined);
                          setDownloaded(false);
                          download.reset();
                        }}
                        className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
                      >
                        <option value="" disabled>
                          {t("chooseAccount")}
                        </option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            •••• {account.accountNumber.slice(-4)} ·{" "}
                            {account.label}
                            {account.isPrimary
                              ? ` (${t("primaryAccount")})`
                              : ""}
                          </option>
                        ))}
                        {value &&
                          !accounts.some((account) => account.id === value) && (
                            <option value={value} disabled>
                              {t("issues.FUNDING_ACCOUNT")}
                            </option>
                          )}
                      </select>
                    </label>
                  );
                })}
                <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                  {(
                    ["payrollService", "smartService", "feePayer"] as const
                  ).map((field) => {
                    const options =
                      field === "payrollService"
                        ? ["PAY", "PA2", "PA3"]
                        : field === "smartService"
                          ? ["SPN", "SPS", "SPN2", "SPS2", "SPN3", "SPS3"]
                          : ["OUR", "BEN"];
                    const required =
                      field === "feePayer" ||
                      selectedRows.some((row) =>
                        field === "payrollService"
                          ? row.bankCode === "014"
                          : !!row.bankCode && row.bankCode !== "014",
                      );
                    return (
                      <label key={field} className="block">
                        <span className="mb-1 block text-xs text-slate-600">
                          {t(field)}
                        </span>
                        <select
                          value={exportOptions[field] ?? ""}
                          required={required}
                          aria-invalid={
                            field !== "feePayer" &&
                            required &&
                            data?.issues.includes("SERVICE")
                          }
                          className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
                          onChange={(event) => {
                            setExportOptions((current) => ({
                              ...current,
                              [field]: event.target.value || undefined,
                            }));
                            setAcknowledgedFingerprint(undefined);
                            setDownloaded(false);
                            download.reset();
                          }}
                        >
                          {field !== "feePayer" && (
                            <option value="">{t("chooseService")}</option>
                          )}
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {t(`services.${option}`)}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                  <p className="text-xs leading-relaxed text-slate-600">
                    {t("exportOptionsHelp")}
                  </p>
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-amber-900">
                {t("issues.SETTINGS_REQUIRED")}
              </p>
            )}
          </div>
          <div aria-live="polite">
            <p className="text-xs text-slate-600">{t("selectedTotal")}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              ฿{moneyFormat(total)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {t("recipientCount", { count: selected.length })}
            </p>
            {!!data?.groups.length && (
              <dl className="mt-4 space-y-3">
                {data.groups.map((group) => (
                  <div
                    key={group.service}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <dt className="text-slate-600">
                      {t(`services.${group.service}`)}
                      <span className="mt-1 block">
                        {t("recipientCount", { count: group.count })}
                      </span>
                    </dt>
                    <dd className="whitespace-nowrap font-medium tabular-nums">
                      ฿{moneyFormat(group.total)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          {data && (
            <div
              className="space-y-2 text-xs leading-relaxed"
              aria-live="polite"
            >
              {data.issues
                .filter(
                  (issue) =>
                    issue !== "SETTINGS_REQUIRED" &&
                    (issue !== "PAYMENT_DATE" || !!paymentDate),
                )
                .map((issue) => (
                  <p key={issue} className="text-red-700">
                    {t(`issues.${issue}`)}
                  </p>
                ))}
              {!!invalidCount && (
                <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-red-800">
                  <CircleAlert
                    size={15}
                    className="mt-0.5 shrink-0"
                    aria-hidden
                  />
                  {t("fixSelected", { count: invalidCount })}
                </p>
              )}
            </div>
          )}
          {data?.hasPaid && (
            <label className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
              <input
                type="checkbox"
                checked={acknowledgePaid}
                className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                onChange={(event) =>
                  setAcknowledgedFingerprint(event.target.checked ? data.fingerprint : undefined)
                }
              />
              {t("paidWarning")}
            </label>
          )}
          <button
            type="button"
            disabled={!canDownload}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            onClick={async () => {
              if (!data) return;
              setDownloaded(false);
              try {
                await download.mutateAsync({
                  ...request,
                  fingerprint: data.fingerprint,
                  acknowledgePaid,
                });
                setDownloaded(true);
              } catch {
                await preview.refetch();
              }
            }}
          >
            <Download size={16} aria-hidden />
            {download.isPending
              ? t("generating")
              : t(data && data.groups.length > 1 ? "downloadZip" : "download")}
          </button>
          {download.isError && (
            <p role="alert" className="text-xs leading-relaxed text-red-700">
              {t("exportError")}
            </p>
          )}
          {downloaded && (
            <p
              role="status"
              className="text-xs leading-relaxed text-emerald-800"
            >
              {t("downloaded")}
            </p>
          )}
          <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
            {t("repeatWarning")}
          </p>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold">{t("recipients")}</h2>
              <p className="mt-1 text-xs text-slate-600" role="status">
                {t("selected", { count: selected.length })}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
              onClick={() => preview.refetch()}
              disabled={preview.isFetching}
            >
              <RefreshCw
                size={14}
                aria-hidden
                className={
                  preview.isFetching
                    ? "animate-spin motion-reduce:animate-none"
                    : ""
                }
              />
              {t("refresh")}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-5">
            <button
              type="button"
              className={buttonClass}
              onClick={() =>
                changeSelection(
                  data
                    ? data.recipients
                        .filter((row) => !row.paid)
                        .map((row) => row.entryId)
                    : entries
                        .filter((row) => !row.entry.paidAt)
                        .map((row) => row.entry.id),
                )
              }
            >
              {t("selectUnpaid")}
            </button>
            <button
              type="button"
              className="text-xs text-slate-600 underline underline-offset-4 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
              onClick={() => changeSelection([])}
            >
              {t("clear")}
            </button>
            {(visibleIssueCount > 0 || showIssues) && (
              <button
                type="button"
                aria-pressed={showIssues}
                className={`ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-red-600 ${showIssues ? "bg-red-100 text-red-800" : "text-red-700 hover:bg-red-50"}`}
                onClick={() => setShowIssues(!showIssues)}
              >
                <CircleAlert size={14} aria-hidden />
                {t("needsAttentionCount", { count: visibleIssueCount })}
              </button>
            )}
          </div>
          {preview.isPending && (
            <div className="space-y-5 p-5" role="status">
              <p className="text-sm text-slate-600">{t("loading")}</p>
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-md bg-slate-100 motion-reduce:animate-none"
                />
              ))}
            </div>
          )}
          {preview.isError && (
            <p role="alert" className="p-5 text-sm text-red-700">
              {t("loadError")}
            </p>
          )}
          {data && (
            <table className="w-full text-left text-sm" role="table">
              <thead className="sr-only md:not-sr-only">
                <tr
                  className="border-b border-slate-200 text-xs text-slate-600"
                  role="row"
                >
                  <th scope="col" className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={t("selectVisible")}
                      className="hidden h-4 w-4 accent-blue-600 md:inline-block"
                      checked={
                        visibleRows.length > 0 &&
                        visibleSelected === visibleRows.length
                      }
                      ref={(element) => {
                        if (element)
                          element.indeterminate =
                            visibleSelected > 0 &&
                            visibleSelected < visibleRows.length;
                      }}
                      onChange={(event) =>
                        changeSelection(
                          event.target.checked
                            ? [
                                ...new Set([
                                  ...selected,
                                  ...visibleRows.map((row) => row.entryId),
                                ]),
                              ]
                            : selected.filter(
                                (id) =>
                                  !visibleRows.some(
                                    (row) => row.entryId === id,
                                  ),
                              ),
                        )
                      }
                    />
                  </th>
                  {[
                    "employee",
                    "status",
                    "amount",
                    "bankDetails",
                    "actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`px-3 py-3 font-medium ${heading === "amount" ? "text-right" : ""}`}
                    >
                      {t(heading)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody role="rowgroup">
                {visibleRows.map((row) => (
                  <tr
                    key={row.entryId}
                    role="row"
                    className={`grid grid-cols-[1.25rem_minmax(0,1fr)_auto] gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-5 last:border-0 md:table-row md:p-0 ${selectedIds.has(row.entryId) ? "bg-blue-50/35" : "hover:bg-slate-50"}`}
                  >
                    <td
                      role="cell"
                      className="row-span-4 pt-0.5 md:px-4 md:py-4 md:align-top"
                    >
                      <input
                        type="checkbox"
                        aria-label={t("selectEmployee", { name: row.name })}
                        className="h-4 w-4 accent-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600"
                        checked={selectedIds.has(row.entryId)}
                        onChange={(event) =>
                          changeSelection(
                            event.target.checked
                              ? [...selected, row.entryId]
                              : selected.filter((id) => id !== row.entryId),
                          )
                        }
                      />
                    </td>
                    <td
                      role="cell"
                      className="col-start-2 row-start-1 min-w-0 md:px-3 md:py-4 md:align-top"
                    >
                      <p className="break-words font-medium text-slate-900">
                        {row.name}
                      </p>
                      <p className="mt-1 break-words text-xs text-slate-600">
                        {paymentMethod("label")} ·{" "}
                        <span className="font-medium text-slate-900">
                          {paymentMethod(
                            preferredMethodsByEntryId.get(row.entryId) ?? "unset",
                          )}
                        </span>
                      </p>
                      <p className="mt-1 break-words text-xs text-slate-600">
                        {t("accountHolder")}: {row.accountHolder || "—"}
                      </p>
                      {row.paid && (
                        <p className="mt-1 text-xs font-medium text-amber-800">
                          {t("paid")}
                        </p>
                      )}
                    </td>
                    <td
                      role="cell"
                      className="col-span-2 col-start-2 row-start-3 md:px-3 md:py-4 md:align-top"
                    >
                      {row.issues.length ? (
                        <details className="max-w-64 text-xs text-red-700">
                          <summary className="cursor-pointer font-medium underline-offset-4 hover:underline">
                            {t("needsAttentionCount", {
                              count: row.issues.length,
                            })}
                          </summary>
                          <ul className="mt-2 space-y-1.5">
                            {row.issues.map((issue) => (
                              <li key={issue}>{t(`issues.${issue}`)}</li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                          <Check size={12} aria-hidden />
                          {t("ready")}
                        </span>
                      )}
                    </td>
                    <td
                      role="cell"
                      className="col-start-3 row-start-1 whitespace-nowrap text-right font-semibold tabular-nums md:px-3 md:py-4 md:align-top"
                    >
                      {row.amount ? `฿${moneyFormat(row.amount)}` : "—"}
                    </td>
                    <td
                      role="cell"
                      className="col-span-2 col-start-2 row-start-2 min-w-0 text-xs text-slate-600 md:px-3 md:py-4 md:align-top"
                    >
                      <p>{row.bankName || "—"}</p>
                      <p className="mt-1 tabular-nums">
                        {row.account ? `•••• ${row.account.slice(-4)}` : "—"}
                      </p>
                    </td>
                    <td
                      role="cell"
                      className="col-span-2 col-start-2 row-start-4 md:px-3 md:py-4 md:align-top"
                    >
                      <button
                        type="button"
                        onClick={() => setEditing(row.employeeId)}
                        className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
                      >
                        <Pencil size={12} aria-hidden />
                        {t("editBank")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && !visibleRows.length && (
            <div className="px-5 py-12 text-center">
              <Users
                size={24}
                className="mx-auto mb-3 text-slate-500"
                aria-hidden
              />
              <p className="text-sm text-slate-600">{t("empty")}</p>
              {showIssues && (
                <button
                  type="button"
                  className="mt-3 text-sm text-blue-700 underline"
                  onClick={() => setShowIssues(false)}
                >
                  {t("showEveryone")}
                </button>
              )}
            </div>
          )}
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
          {t("readyHelp")}
        </p>
      </div>

      {editing !== null && (
        <EmployeeDetailsModal
          employeeId={editing}
          open
          setOpen={(open) => {
            const next = typeof open === "function" ? open(true) : open;
            if (!next) {
              setEditing(null);
              setAcknowledgedFingerprint(undefined);
              setDownloaded(false);
              void queryClient.invalidateQueries({
                queryKey: ["scb-payment", shopId, periodId],
              });
              void queryClient.invalidateQueries({ queryKey: ["periods"] });
            }
          }}
        />
      )}
    </section>
  );
}
