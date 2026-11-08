"use client";

import { EmployeeWithBranchDTO } from "@/types/type.employee";
import { TextInput } from "@/widget/Input";
import { useState } from "react";
import { Alert, Button, FormControl, FormLabel } from "@mui/joy";
import { useLocale, useTranslations } from "next-intl";
import { useDebounce } from "use-debounce";
import { useEmployees } from "@/hooks/hook.employee";
import BranchSelector from "@/widget/BranchSelector";
import TableWithCheckBox from "@/widget/TableWIthCheckbox";
import ChangableAvatar from "@/widget/ChangableAvatar";
import Pagination from "@/app/components/UI/Pagination";
import { getLocalizedName } from "@/lib/getLocalizedName";

export default function EmployeePicker({
  value,
  onChange,
  disabled = false,
  excludedIds = [],
}: {
  value: number[];
  onChange: (ids: number[], employees: EmployeeWithBranchDTO[]) => void;
  excludedIds?: number[];
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [branchId, setBranchId] = useState(-1);
  const employees = useEmployees({ search_query: debounced, branchId, page });
  const locale = useLocale();
  const te = useTranslations("employees");
  const t = useTranslations("employee_presets");
  const tc = useTranslations("common");
  const rows =
    employees.data?.data?.filter(
      (employee) => !excludedIds.includes(employee.id),
    ) ?? [];
  const pageIds = rows.map((employee) => employee.id);
  const updateSelection = (ids: number[]) =>
    onChange(
      ids,
      rows.filter((employee) => ids.includes(employee.id)),
    );
  const selectedOnPage = pageIds.filter((id) => value.includes(id)).length;

  return (
    <fieldset
      disabled={disabled}
      className="min-w-0 border-0 p-0 m-0 flex flex-col gap-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormControl className="flex-1">
          <FormLabel>{te("search.label")}</FormLabel>
          <TextInput
            value={search}
            placeholder={te("search.placeholder")}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </FormControl>
        <FormControl className="sm:w-44">
          <FormLabel>{te("fields.branch")}</FormLabel>
          <BranchSelector
            branchId={branchId}
            onChange={(id) => {
              setBranchId(id);
              setPage(1);
            }}
            isEnableAll
            disable={disabled}
          />
        </FormControl>
      </div>
      <p className="text-sm" aria-live="polite">
        {tc("selected", { count: value.length })}
      </p>
      {employees.isError ? (
        <Alert
          color="danger"
          role="alert"
          endDecorator={
            <Button
              size="sm"
              variant="plain"
              color="danger"
              onClick={() => employees.refetch()}
            >
              {t("retry")}
            </Button>
          }
        >
          {t("employees_load_failed")}
        </Alert>
      ) : (
        <div className="overflow-auto max-h-[40vh]">
          <TableWithCheckBox
            data={rows}
            isLoading={employees.isLoading}
            isSuccess={employees.isSuccess}
            loadingLabel={t("loading_employees")}
            emptyLabel={t("no_employees")}
            editColumn={false}
            selectAllLabel={t("select_page")}
            selectionLabel={(row) => `${row.firstName} ${row.lastName}`}
            checkboxMethods={{
              checked: value,
              isChecked: (id) => value.includes(Number(id)),
              toggle: (id) =>
                updateSelection(
                  value.includes(Number(id))
                    ? value.filter((v) => v !== Number(id))
                    : [...value, Number(id)],
                ),
              checkall: (ids) =>
                updateSelection([...new Set([...value, ...ids.map(Number)])]),
              uncheckall: () =>
                updateSelection(value.filter((id) => !pageIds.includes(id))),
              isAllChecked: () =>
                pageIds.length > 0 && selectedOnPage === pageIds.length,
              isSomeChecked: () =>
                selectedOnPage > 0 && selectedOnPage < pageIds.length,
              isNoneChecked: () => value.length === 0,
            }}
            columns={[
              {
                key: "name",
                label: te("fields.name"),
                render: (row) => (
                  <span className="flex items-center gap-2 py-2 pr-4 whitespace-nowrap">
                    <ChangableAvatar
                      src={row.avatarUrl ?? ""}
                      fallbackTitle={row.firstName.charAt(0)}
                      editable={false}
                    />
                    <span>
                      {row.firstName} {row.lastName}
                    </span>
                  </span>
                ),
              },
              {
                key: "nickName",
                label: te("fields.nickname"),
                render: (row) => (
                  <span className="whitespace-nowrap pr-4">{row.nickName}</span>
                ),
              },
              {
                key: "branch",
                label: te("fields.branch"),
                render: (row) => (
                  <span className="whitespace-nowrap pr-4">
                    {getLocalizedName(row.branch, locale)}
                  </span>
                ),
              },
            ]}
          />
        </div>
      )}
      <div className="flex justify-center">
        <Pagination
          totalPages={employees.data?.pagination.totalPages || 1}
          page={page}
          onPageChange={setPage}
        />
      </div>
    </fieldset>
  );
}
