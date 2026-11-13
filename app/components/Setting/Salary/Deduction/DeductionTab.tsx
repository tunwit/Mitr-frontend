import ConfirmModal from "@/widget/ConfirmModal";
import { Button } from "@mui/joy";
import React, { useState } from "react";
import { useCheckBox } from "@/hooks/useCheckBox";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { showError, showSuccess } from "@/utils/showSnackbar";
import TableWithCheckBox from "@/widget/TableWIthCheckbox";
import AddEditDeductionModal from "./AddEditDeductionModal";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { CompensationFieldPublicDTO } from "@/types/payroll/type.compensation";
import {
  useCompensationField,
  useDeleteCompensationField,
} from "@/hooks/payroll/fields/hook.compensation";
import { COMPEN_FIELD_DEFINATION_TYPE } from "@/types/enum/enum.compensation";
export default function DeductionTab() {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmation = useTranslations("confirm_modal");
  const [selectedField, setSelectedField] =
    useState<CompensationFieldPublicDTO | null>(null);
  const { id: shopId } = useCurrentShop();
  const { user } = useUser();
  const checkboxMethods = useCheckBox<number>("allIncomeTable");
  const { checked, uncheckall } = checkboxMethods;
  const t = useTranslations("deduction");
  const { mutateAsync: deleteMutate, isPending: isDeleting } = useDeleteCompensationField();


  const addHandler = () => {
    setSelectedField(null);
    setOpen(true);
  };
  const { data, isLoading, isSuccess } = useCompensationField(
    COMPEN_FIELD_DEFINATION_TYPE.DEDUCTION,
  );

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
        <AddEditDeductionModal
          open={open}
          setOpen={setOpen}
          field={selectedField}
        />
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
              <p className="underline font-medium"> {t("actions.delete")}</p>
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
              { key: "formular", label: t("fields.formular") },
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
