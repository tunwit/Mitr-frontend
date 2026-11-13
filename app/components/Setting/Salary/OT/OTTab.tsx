import ConfirmModal from "@/widget/ConfirmModal";
import { Button } from "@mui/joy";
import { useState } from "react";
import { useCheckBox } from "@/hooks/useCheckBox";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { showError, showSuccess } from "@/utils/showSnackbar";
import TableWithCheckBox from "@/widget/TableWIthCheckbox";
import AddEditOTModal from "./AddEditOTModal";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useDeleteOTField, useOTFields } from "@/hooks/payroll/fields/hook.ot";
import { OTFieldPublicDTO } from "@/types/payroll/type.ot";

export default function OTTab() {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmation = useTranslations("confirm_modal");
  const [selectedField, setSelectedField] = useState<OTFieldPublicDTO | null>(
    null,
  );
  const { id: shopId } = useCurrentShop();
  const checkboxMethods = useCheckBox<number>("allOTTable");
  const { checked, uncheckall } = checkboxMethods;
  const { user } = useUser();
  const t = useTranslations("overtime");

  const addHandler = () => {
    setSelectedField(null);
    setOpen(true);
  };
  const { data, isLoading, isSuccess } = useOTFields();
  const { mutateAsync: deleteMutate, isPending: isDeleting } = useDeleteOTField();

  const handleDelete = async () => {
    try {
      if (!shopId || !user?.id || !checked.length) return false;
      await deleteMutate({ shopId: shopId, ids: checked });
      uncheckall();
      showSuccess("Delete field success");
    } catch {
      showError("Delete field failed");
      return false;
    }
  };

  return (
    <>
      <ConfirmModal
        title={confirmation("delete_payroll_fields")}
        description={confirmation("delete_payroll_fields_description")}
        open={confirmDelete}
        setOpen={setConfirmDelete}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
      <div className="-mt-4">
        <AddEditOTModal open={open} setOpen={setOpen} field={selectedField} />
        <h1 className="font-medium text-3xl">{t("label")}</h1>
        <p className="opacity-70 font-normal text-xs mt-1">
          {t("description")}
        </p>
        <div className="-mt-6">
          <div className="flex flex-row-reverse">
            <Button
              disabled={checked ? checked.length === 0 : true}
              variant="plain"
              onClick={() => setConfirmDelete(true)}
            >
              <p className="underline font-medium">{t("actions.delete")}</p>
            </Button>
          </div>
          <TableWithCheckBox
            data={data?.data}
            isLoading={isLoading}
            isSuccess={isSuccess}
            checkboxMethods={checkboxMethods}
            setSelectedItem={setSelectedField}
            setOpen={setOpen}
            columns={[
              { key: "name", label: t("fields.name") },
              { key: "nameEng", label: t("fields.name_eng") },
              {
                key: "type",
                label: t("fields.type"),
                render: (row: OTFieldPublicDTO) =>
                  t(`type.${row.type.toLowerCase()}`),
              },
              {
                key: "method",
                label: t("fields.method"),
                render: (row: OTFieldPublicDTO) =>
                  t(`method.${row.method.toLowerCase()}`),
              },
              { key: "rate", label: t("fields.rate") },
            ]}
          />
        </div>
        <div className="mt-2">
          <Button onClick={addHandler}>{t("actions.create")}</Button>
        </div>
      </div>
    </>
  );
}
