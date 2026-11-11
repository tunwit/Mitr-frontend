"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  FormLabel,
  Option,
  Select,
  Sheet,
  Skeleton,
  Typography,
} from "@mui/joy";
import Pagination from "@/app/components/UI/Pagination";
import HistoryIcon from "@/assets/icons/HistoryIcon";
import { useAuditLog, useAuditLogFilters } from "@/hooks/hook.auditLog";
import { useOwners } from "@/hooks/hook.owner";
import { useOwnShop } from "@/hooks/hook.shop";
import type { AuditLogAction, AuditLogEntry } from "@/types/type.auditLog";
import Breadcrumbs from "@/widget/Breadcrumbs";

const timeZone = "Asia/Bangkok";
const promptFont = "font-[family-name:var(--font-prompt),sans-serif]!";
const filterLabelClass = `${promptFont} mb-1.5! text-xs/[17px]! font-medium! text-[#1f1f1f]!`;
const selectClass = `${promptFont} min-h-10! rounded-[5px]! border-[#c8cfdb]! bg-white! px-3! text-sm/5! font-medium! text-[#1f1f1f]! shadow-none!`;
const stateClass = "flex min-h-[92px] flex-col gap-1.5 px-(--audit-inset) py-6";
const rowTitleClass = `${promptFont} text-sm/5! font-semibold! text-[#1f1f1f]!`;
const rowSubtitleClass = `${promptFont} text-xs/[17px]! font-normal! text-[#545960]!`;
const markerColors: Partial<Record<string, "success" | "primary" | "warning" | "danger">> = {
  finalize: "success",
  create: "primary",
  update: "warning",
  rename: "warning",
  replace: "warning",
  update_settings: "warning",
  update_avatar: "warning",
  delete: "danger",
};

function actionKey({ resourceType, actionType }: AuditLogAction) {
  return `${resourceType}:${actionType}`;
}

function Marker({ resourceType, actionType }: AuditLogAction) {
  const color = markerColors[actionType] ?? "neutral";
  const payroll = resourceType.startsWith("payroll_");
  const icon = payroll
    ? "payroll"
    : resourceType.endsWith("_document")
      ? "document"
      : resourceType.startsWith("employee") || resourceType === "shop_owner"
        ? "employee"
        : null;

  return (
    <Box
      component="span"
      aria-hidden="true"
      className="z-[1] grid size-8 place-items-center rounded-full"
      sx={{ bgcolor: `${color}.softBg`, color: `${color}.softColor` }}
    >
      {icon ? (
        <span
          className="size-4 bg-current"
          style={{ mask: `url(/audit-log/${icon}.svg) center / contain no-repeat` }}
        />
      ) : (
        <HistoryIcon className="size-4" />
      )}
    </Box>
  );
}

export default function AuditLogPage({
  shopId,
  fallbackShopName,
}: {
  shopId: number | null;
  fallbackShopName: string;
}) {
  const t = useTranslations("audit_log");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<AuditLogAction>();
  const [actorId, setActorId] = useState("");
  const logs = useAuditLog(shopId, page, action, actorId);
  const filters = useAuditLogFilters(shopId);
  const owners = useOwners();
  const shops = useOwnShop();
  const shopName =
    shops.data?.data?.find(({ id }) => id === shopId)?.name ?? fallbackShopName;
  const entries = logs.data?.data ?? [];
  const pagination = logs.data?.pagination;
  const filtered = Boolean(action || actorId);

  const localizeKey = (namespace: "resources" | "actions", value: string) => {
    const key = `${namespace}.${value}`;
    return t.has(key) ? t(key) : value.replaceAll("_", " ");
  };
  const actionLabel = (item: AuditLogAction) => {
    const key = `event_labels.${item.resourceType}_${item.actionType}`;
    return t.has(key)
      ? t(key)
      : t("event", {
          resource: localizeKey("resources", item.resourceType),
          action: localizeKey("actions", item.actionType),
        });
  };
  const names = new Map(
    (owners.isPlaceholderData ? [] : (owners.data?.data ?? [])).map((owner) => [
      owner.id,
      owner.fullName ||
        [owner.firstName, owner.lastName].filter(Boolean).join(" "),
    ]),
  );
  const actorLabel = (id: string) =>
    names.get(id) || t("actor_fallback", { id });
  const collator = new Intl.Collator(locale);
  const actionOptions = (filters.data?.data?.actions ?? [])
    .map((item) => ({
      item,
      key: actionKey(item),
      label:
        item.actionType === "create" && item.resourceType.endsWith("_document")
          ? t("document_filter", {
              resource: localizeKey("resources", item.resourceType),
            })
          : actionLabel(item),
    }))
    .sort((a, b) => collator.compare(a.label, b.label));
  const actorOptions = (filters.data?.data?.actorIds ?? [])
    .map((id) => ({
      id,
      label: actorLabel(id),
    }))
    .sort((a, b) => collator.compare(a.label, b.label));

  const dateFormat = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : locale,
    {
      dateStyle: "full",
      timeZone,
    },
  );
  const timeFormat = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  });
  const groups = new Map<string, AuditLogEntry[]>();
  for (const entry of entries) {
    const day = dateFormat.format(new Date(entry.createdAt));
    const group = groups.get(day) ?? [];
    group.push(entry);
    groups.set(day, group);
  }

  function resourceLabel(entry: AuditLogEntry) {
    const name =
      entry.after?.fileName ??
      entry.after?.name ??
      entry.before?.fileName ??
      entry.before?.name;
    if (typeof name === "string" && name.trim()) return name;
    const resource = localizeKey("resources", entry.resourceType);
    return entry.resourceId
      ? t("record", { resource, id: entry.resourceId })
      : resource;
  }

  return (
    <>
      <title>{`${t("title")} - Mitr`}</title>
      <Box
        component="main"
        className="flex min-w-0 flex-1 flex-col gap-6 overflow-auto bg-white page-gutter py-10
          font-[family-name:var(--font-prompt),sans-serif] text-[#1f1f1f] [--audit-inset:22px]
          [@media(width<=640px)]:gap-[18px] [@media(width<=640px)]:[--audit-inset:12px]"
      >
        <Breadcrumbs
          items={[{ label: shopName }, { label: t("title") }]}
        />
        <header>
          <Typography
            component="h1"
            className={`${promptFont} mb-1! text-[36px]/[51px]! font-bold! text-[#1f1f1f]! [@media(width<=640px)]:text-[30px]/[42px]!`}
          >
            {t("title")}
          </Typography>
          <Typography
            className={`${promptFont} text-sm/5! font-normal! text-[#545960]!`}
          >
            {t("description")}
          </Typography>
        </header>

        <Box className="flex flex-wrap gap-3">
          <FormControl className="w-[280px] min-w-0! max-w-full [@media(width<=640px)]:flex-[1_1_130px]">
            <FormLabel className={filterLabelClass}>{t("action")}</FormLabel>
            <Select
              value={action ? actionKey(action) : ""}
              onChange={(_, value) => {
                setAction(
                  actionOptions.find((option) => option.key === value)?.item,
                );
                setPage(1);
              }}
              className={selectClass}
              indicator={
                <Image
                  src="/audit-log/chevron-down.svg"
                  width={16}
                  height={16}
                  alt=""
                  unoptimized
                />
              }
            >
              <Option value="">{t("all_actions")}</Option>
              {actionOptions.map(({ key, label }) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </FormControl>
          <FormControl className="w-[232px] min-w-0! max-w-full [@media(width<=640px)]:flex-[1_1_130px]">
            <FormLabel className={filterLabelClass}>
              {t("changed_by")}
            </FormLabel>
            <Select
              value={actorId}
              onChange={(_, value) => {
                setActorId(value ?? "");
                setPage(1);
              }}
              className={selectClass}
              indicator={
                <Image
                  src="/audit-log/chevron-down.svg"
                  width={16}
                  height={16}
                  alt=""
                  unoptimized
                />
              }
            >
              <Option value="">{t("anyone")}</Option>
              {actorOptions.map(({ id, label }) => (
                <Option key={id} value={id}>
                  {label}
                </Option>
              ))}
            </Select>
          </FormControl>
        </Box>
        {filters.isError && (
          <Alert
            color="warning"
            endDecorator={
              <Button
                size="sm"
                variant="plain"
                onClick={() => void filters.refetch()}
              >
                {t("retry")}
              </Button>
            }
          >
            {t("filters_error")}
          </Alert>
        )}

        <Sheet
          component="section"
          aria-labelledby="audit-timeline"
          aria-busy={logs.isFetching}
          className="shrink-0 overflow-hidden rounded-[12px] border! border-[#e4e5e7]! bg-white!"
        >
          <header className="flex min-h-14 items-center justify-between gap-3 border-b border-[#ecedef] px-(--audit-inset) py-2 [@media(width<=640px)]:flex-wrap [@media(width<=640px)]:gap-x-2 [@media(width<=640px)]:gap-y-[5px]">
            <div className="flex min-w-0 items-center gap-2 [@media(width<=640px)]:flex-wrap [@media(width<=640px)]:gap-y-[5px]">
              <Typography
                component="h2"
                id="audit-timeline"
                className={`${promptFont} text-[17px]/6! font-semibold! text-[#1f1f1f]!`}
              >
                {t("timeline")}
              </Typography>
              {pagination && (
                <Chip
                  size="sm"
                  className={`${promptFont} min-h-[22px]! bg-[#f6f7f8]! px-2! py-[3px]! text-[11px]/4! font-medium! whitespace-nowrap text-[#545960]!`}
                >
                  {t("event_count", { count: entries.length })}
                </Chip>
              )}
            </div>
            <span className="flex items-center gap-[5px] text-[11px]/4 font-medium whitespace-nowrap text-[#545960]">
              <Image
                src="/audit-log/clock.svg"
                width={14}
                height={14}
                alt=""
                unoptimized
              />
              {t("timezone")}
            </span>
          </header>

          {logs.isPending ? (
            <div className={stateClass} role="status" aria-label={t("loading")}>
              <Skeleton variant="rectangular" height={18} width="40%" />
              <Skeleton variant="rectangular" height={12} width="28%" />
            </div>
          ) : logs.isError ? (
            <div className={stateClass}>
              <Alert
                color="danger"
                endDecorator={
                  <Button
                    size="sm"
                    variant="plain"
                    onClick={() => void logs.refetch()}
                  >
                    {t("retry")}
                  </Button>
                }
              >
                {t("error")}
              </Alert>
            </div>
          ) : entries.length === 0 ? (
            <div className={stateClass} role="status">
              <Typography className={rowTitleClass}>
                {t(filtered ? "no_matches" : "empty")}
              </Typography>
              <Typography className={rowSubtitleClass}>
                {t(filtered ? "no_matches_hint" : "empty_hint")}
              </Typography>
            </div>
          ) : (
            Array.from(groups, ([day, items]) => (
              <section
                key={day}
                className="[&+section]:border-t [&+section]:border-[#ecedef]"
              >
                <Typography
                  component="h3"
                  className={`${promptFont} bg-[#f6f7f8] px-(--audit-inset) pt-[9px] pb-2.5 text-xs/[17px]! font-semibold! text-[#545960]!`}
                >
                  {day}
                </Typography>
                <ol className="m-0 list-none px-(--audit-inset) py-0">
                  {items.map((entry) => {
                    const name = actorLabel(entry.actorId);
                    const initials =
                      names
                        .get(entry.actorId)
                        ?.split(/\s+/)
                        .slice(0, 2)
                        .map((part) => Array.from(part)[0])
                        .join("") || "?";
                    return (
                      <li
                        key={entry.id}
                        className="relative grid min-h-[66px] grid-cols-[32px_minmax(0,1fr)_minmax(112px,180px)_88px] items-center gap-3 py-2.5
                          not-last:before:absolute not-last:before:top-1/2 not-last:before:-bottom-1/2 not-last:before:left-[15.5px] not-last:before:w-px not-last:before:bg-[#e4e5e7]
                          not-last:after:absolute not-last:after:right-0 not-last:after:bottom-0 not-last:after:left-11 not-last:after:h-px not-last:after:bg-[#ecedef]
                          [@media(640px<width<=900px)]:grid-cols-[32px_minmax(0,1fr)_minmax(90px,140px)_42px]
                          [@media(width<=640px)]:grid-cols-[32px_minmax(0,1fr)_42px] [@media(width<=640px)]:gap-y-1.5
                          [@media(width<=640px)]:not-last:before:top-[26px] [@media(width<=640px)]:not-last:before:-bottom-[26px]"
                      >
                        <Marker {...entry} />
                        <div className="grid min-w-0 gap-0.5 wrap-anywhere">
                          <Typography className={rowTitleClass}>
                            {actionLabel(entry)}
                          </Typography>
                          <Typography className={rowSubtitleClass}>
                            {resourceLabel(entry)}
                          </Typography>
                        </div>
                        <div className="flex min-w-0 items-center gap-2 [@media(width<=640px)]:col-span-2 [@media(width<=640px)]:col-start-2">
                          <Avatar
                            aria-hidden="true"
                            className={`${promptFont} size-6! text-[11px]/4! font-semibold! ${
                              entry.actorId.charCodeAt(
                                entry.actorId.length - 1,
                              ) %
                                8 >=
                              4
                                ? "bg-[#eee7dd]! text-[#5c452c]!"
                                : "bg-[#e8eef0]! text-[#344d58]!"
                            }`}
                          >
                            {initials}
                          </Avatar>
                          <Typography
                            className={`${promptFont} truncate text-xs/[17px]! font-medium! text-[#545960]!`}
                            title={name}
                          >
                            {name}
                          </Typography>
                        </div>
                        <time
                          className="text-right text-[13px]/[18px] font-medium [@media(width<=640px)]:col-start-3 [@media(width<=640px)]:row-start-1"
                          dateTime={entry.createdAt}
                        >
                          {timeFormat.format(new Date(entry.createdAt))}
                        </time>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))
          )}

          {pagination &&
            (pagination.totalPages > 1 || page > 1 ? (
              <nav
                className="overflow-x-auto border-t border-[#ecedef] px-(--audit-inset) pb-3 [&>div]:justify-center-safe!"
                aria-label={t("pagination")}
              >
                <Pagination
                  page={page}
                  totalPages={Math.max(1, pagination.totalPages)}
                  onPageChange={setPage}
                  disabled={logs.isFetching}
                  previousLabel={t("previous_page")}
                  nextLabel={t("next_page")}
                />
              </nav>
            ) : entries.length > 0 ? (
              <footer className="border-t border-[#ecedef] px-(--audit-inset) pt-3 pb-[13px] text-[11px]/4 text-[#545960]">
                {t("end")}
              </footer>
            ) : null)}
        </Sheet>
      </Box>
    </>
  );
}
