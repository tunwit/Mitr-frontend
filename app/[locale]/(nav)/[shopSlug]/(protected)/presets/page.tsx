"use client";

import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { useState } from "react";
import { Alert, Button } from "@mui/joy";
import Add from "@mui/icons-material/Add";
import { useTranslations } from "next-intl";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useEmployeePresets } from "@/hooks/hook.employeePreset";
import { EmployeePresetDTO } from "@/types/type.employeePreset";
import TableWithCheckBox from "@/widget/TableWIthCheckbox";
import ConfirmModal from "@/widget/ConfirmModal";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { useCheckBox } from "@/hooks/useCheckBox";
import { ChevronRight } from "@mui/icons-material";
import { dateFormat } from "@/utils/formmatter";
import { SearchInput } from "@/widget/Input";

export default function EmployeePresetsPage() {
  const t = useTranslations("employee_presets");
  const tb = useTranslations("breadcrumb");
  const { id: shopId, slug, name } = useCurrentShop();
  const { list, remove } = useEmployeePresets();
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const presets = list.data?.data?.filter((preset) =>
    preset.name.toLocaleLowerCase().includes(query),
  );
  const checkboxMethods = useCheckBox<number>(`employee-presets-${shopId}`);
  const selectedPresets =
    presets?.filter((preset) => checkboxMethods.isChecked(preset.id)) ?? [];
  const [deleting, setDeleting] = useState<EmployeePresetDTO[] | null>(null);

  const deletePreset = async () => {
    if (!deleting?.length || remove.isPending) return false;
    try {
      const ids = deleting.map((preset) => preset.id);
      await remove.mutateAsync(ids);
      checkboxMethods.checkall(
        checkboxMethods.checked.filter((id) => !ids.includes(id)),
      );
      showSuccess(t("deleted_selected", { count: ids.length }));
      setDeleting(null);
    } catch {
      showError(t("delete_failed"));
      return false;
    }
  };

  return (
    <main className="min-h-screen w-full bg-white font-medium">
      <title>{t("presets")} - Mitr</title>
      <section className="page-gutter pt-10 pb-5">
        <Breadcrumbs
          items={[
            { label: name },
            { label: tb("dashboard") },
            { label: tb("payrolls"), href: `/${slug}/periods` },
            { label: t("presets") },
          ]}
        />
        <div className="mt-5 flex flex-wrap justify-between items-start gap-3">
          <h1 className="text-black text-4xl font-bold">{t("presets")}</h1>
          <Button
            component={Link}
            href={`/${slug}/presets/new`}
            sx={{ height: 40 }}
            startDecorator={<Add sx={{ fontSize: 20 }} />}
          >
            {t("create")}
          </Button>
        </div>
      </section>
      <section className="page-gutter pb-10">
        <div className="mb-5 w-full sm:w-[60%]">
          <label
            htmlFor="preset-search"
            className="block text-black text-xs mb-1"
          >
            {t("search_label")}
          </label>
          <SearchInput
            id="preset-search"
            placeholder={t("search_placeholder")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              checkboxMethods.uncheckall();
            }}
            className="h-6"
          />
        </div>
        <div className="mb-3">
          <Button
            variant="plain"
            color="danger"
            disabled={
              !selectedPresets.length || remove.isPending || list.isError
            }
            onClick={() => setDeleting(selectedPresets)}
          >
            <span className="underline font-medium">
              {t("delete_selected", { count: selectedPresets.length })}
            </span>
          </Button>
        </div>
        {list.isError && (
          <Alert
            color="danger"
            role="alert"
            endDecorator={
              <Button
                color="danger"
                variant="plain"
                onClick={() => list.refetch()}
              >
                {t("retry")}
              </Button>
            }
          >
            {t("load_failed")}
          </Alert>
        )}
        {!list.isError && (
          <TableWithCheckBox
            data={presets}
            isLoading={list.isLoading}
            isSuccess={list.isSuccess}
            editColumn={false}
            checkboxMethods={checkboxMethods}
            selectAllLabel={t("select_all_presets")}
            selectionLabel={(preset) =>
              t("select_preset", { name: preset.name })
            }
            tableLabel={t("presets")}
            loadingLabel={t("loading")}
            emptyLabel={t(query ? "no_matching_presets" : "empty")}
            columns={[
              {
                key: "name",
                label: t("name"),
                render: (preset) => (
                  <Link
                    href={`/${slug}/presets/${preset.id}`}
                    className=" text-sm"
                  >
                    {preset.name}
                  </Link>
                ),
              },
              {
                key: "employees",
                label: "",
                render: (preset) =>
                  t("member_count", { count: preset.employees.length }),
              },
              {
                key: "updatedAt",
                label: t("updated_at"),
                render: (preset) =>
                  preset.updatedAt
                    ? dateFormat(new Date(preset.updatedAt))
                    : "—",
              },
              {
                key: "actions",
                label: "",
                render: (preset) => (
                  <div className="flex gap-2 py-2 pr-4">
                    <Link
                      href={`/${slug}/presets/${preset.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                    >
                      {t("edit")}
                      <ChevronRight />
                    </Link>
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>
      <ConfirmModal
        title={t("delete_selected_title", { count: deleting?.length ?? 0 })}
        description={
          deleting?.length === 1
            ? t("delete_description", { name: deleting[0].name })
            : t("delete_selected_description", { count: deleting?.length ?? 0 })
        }
        open={deleting !== null}
        setOpen={(open) => {
          if (!open && !remove.isPending) setDeleting(null);
        }}
        onConfirm={deletePreset}
        isPending={remove.isPending}
      />
    </main>
  );
}
