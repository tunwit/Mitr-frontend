import ConfirmModal from "@/widget/ConfirmModal";
import { Button } from "@mui/joy";
import { useState } from "react";
import { useCheckBox } from "@/hooks/useCheckBox";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { showError, showSuccess } from "@/utils/showSnackbar";
import TableWithCheckBox from "@/widget/TableWIthCheckbox";

import AddEditPenaltyModal from "./AddEditPenaltyModal";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import {
  useDeletePenaltyField,
  usePenaltyFields,
} from "@/hooks/payroll/fields/hook.penalty";
import { PenaltyFieldPublicDTO } from "@/types/payroll/type.penalty";

export default function PenaltyTab() {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmation = useTranslations("confirm_modal");
  const [selectedField, setSelectedField] =
    useState<PenaltyFieldPublicDTO | null>(null);
  const { id: shopId } = useCurrentShop();
  const checkboxMethods = useCheckBox<number>("allPenaltyTable");
  const { checked, uncheckall } = checkboxMethods;
  const { user } = useUser();
  const t = useTranslations("penalty");
  const addHandler = () => {
    setSelectedField(null);

    setOpen(true);
  };

  const { data, isLoading, isSuccess } = usePenaltyFields();
  const { mutateAsync: deleteMutate, isPending: isDeleting } = useDeletePenaltyField();

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
        <AddEditPenaltyModal
          open={open}
          setOpen={setOpen}
          field={selectedField}
        />
        <div className="flex flex-row items-center gap-3">
          <h1 className="font-medium text-3xl">{t("label")}</h1>
          <p className="opacity-80">{t("details")}</p>
        </div>
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
              {
                key: "type",
                label: t("fields.type"),
                render: (row: PenaltyFieldPublicDTO) =>
                  t(`type.${row.type.toLowerCase()}`),
              },
              {
                key: "method",
                label: t("fields.method"),
                render: (row: PenaltyFieldPublicDTO) =>
                  t(`method.${row.method.toLowerCase()}`),
              },
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
