"use client";

import { Checkbox } from "@mui/joy";
import { Icon } from "@iconify/react";
import React, { Dispatch, SetStateAction } from "react";
import { UseCheckBoxResult } from "@/hooks/useCheckBox";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode; // custom render for a column
  width?: string;
}

interface GenericTableProps<
  T extends { id: string | number },
  ID extends string | number = T["id"],
> {
  data: T[] | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  checkboxMethods?: UseCheckBoxResult<ID>;
  tableLabel?: string;
  columns: Column<T>[];
  editColumn?: boolean;
  setSelectedItem?: Dispatch<SetStateAction<T | null>>;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  selectionLabel?: (row: T) => string;
  selectAllLabel?: string;
  loadingLabel?: string;
  emptyLabel?: string;
}

export default function TableWithCheckBox<T extends { id: number | string }>({
  data,
  isLoading,
  isSuccess,
  checkboxMethods,
  columns,
  tableLabel,
  editColumn = true,
  setSelectedItem,
  setOpen,
  selectionLabel,
  selectAllLabel,
  loadingLabel = "Loading...",
  emptyLabel = "No Data",
}: GenericTableProps<T>) {
  const extraColumns = (checkboxMethods ? 1 : 0) + (editColumn ? 1 : 0);
  const handleAllCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!data || !checkboxMethods) return;
    if (e.currentTarget.checked) {
      checkboxMethods.checkall(data.map((v) => v.id));
    } else {
      checkboxMethods.uncheckall();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-auto">
        <table aria-label={tableLabel} className="w-full">
          <thead className=" bg-gray-50 border border-gray-200">
            <tr className="bg-gray-100 h-15 rounded-t-md text-left ">
              {checkboxMethods && (
                <th className="font-light text-sm pl-6 w-[4%] whitespace-nowrap min-w-15">
                  <Checkbox
                    slotProps={{ input: { "aria-label": selectAllLabel } }}
                    checked={checkboxMethods.isAllChecked(data?.length ?? 0)}
                    indeterminate={checkboxMethods.isSomeChecked(
                      data?.length ?? 0,
                    )}
                    onChange={(e) => handleAllCheckbox(e)}
                  />
                </th>
              )}
              {columns.map((col, index) => (
                <th
                  key={col.key.toString()}
                  className={`font-light text-sm whitespace-nowrap ${!checkboxMethods && index === 0 ? "pl-6" : ""} ${col.width ?? ""}`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {editColumn && <th className="font-medium w-[5%]"></th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && (
              <tr className="h-20 hover:bg-gray-50 transition-colors cursor-pointer ">
                <td
                  colSpan={columns.length + extraColumns}
                  className="text-center"
                >
                  <span className="flex items-center gap-2 w-full justify-center">
                    <Icon
                      icon={"mynaui:spinner"}
                      className="animate-spin"
                      fontSize={25}
                    />
                    <p>{loadingLabel}</p>
                  </span>
                </td>
              </tr>
            )}

            {isSuccess && !data?.length && (
              <tr className="h-20 hover:bg-gray-50 transition-colors cursor-pointer">
                <td
                  colSpan={columns.length + extraColumns}
                  className="text-center"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}

            {isSuccess &&
              data?.map((row, i) => (
                <tr
                  key={row.id}
                  className="h-15 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {checkboxMethods && (
                    <td className="pl-6">
                      <Checkbox
                        slotProps={{
                          input: { "aria-label": selectionLabel?.(row) },
                        }}
                        checked={checkboxMethods.isChecked(row.id)}
                        onChange={() => checkboxMethods.toggle(row.id)}
                      />
                    </td>
                  )}

                  {columns.map((col, index) => (
                    <td
                      key={col.key.toString()}
                      className={
                        !checkboxMethods && index === 0 ? "pl-6" : undefined
                      }
                    >
                      {col.render
                        ? col.render(row, i)
                        : (row[col.key as keyof T] as React.ReactNode)}
                    </td>
                  ))}

                  {editColumn && setSelectedItem && (
                    <td
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedItem(row);
                        setOpen?.(true);
                      }}
                    >
                      <Icon icon="ic:baseline-edit" className="text-xl" />
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
