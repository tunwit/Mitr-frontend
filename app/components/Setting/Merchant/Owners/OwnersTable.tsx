import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { Button } from "@mui/joy";
import React, { useState } from "react";
import InvitationModal from "./InvitationModal";
import TableWithCheckBox from "@/widget/TableWIthCheckbox";
import { useCheckBox } from "@/hooks/useCheckBox";
import { useUser } from "@clerk/nextjs";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "@/widget/ConfirmModal";
import { useTranslations } from "next-intl";
import { formatModifiedTime } from "@/utils/formmatter";
import { useDeleteOwners, useOwners } from "@/hooks/hook.owner";
import ChangableAvatar from "@/widget/ChangableAvatar";

export default function OwnersTable() {
  const { id: shopId } = useCurrentShop();
  const { user } = useUser();
  const { data, isLoading, isSuccess } = useOwners();
  const [open, setOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const checkboxMethods = useCheckBox<string>("ownerTable");
  const { checked, uncheckall } = checkboxMethods;
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("owners");
  const tDate = useTranslations("date_format");
  const { mutateAsync: deleteAsync } = useDeleteOwners();

  const handleDelete = async () => {
    try {
      if (!shopId) return;
      uncheckall();
      await deleteAsync({ toDeleteUserIds: checked });
      showSuccess("Delete owners success");
      queryClient.invalidateQueries({ queryKey: ["owners"] });

      router.refresh();
    } catch (err) {
      showError(`Delete owners failed \n${err}`);
    }
  };

  return (
    <div className="-mt-4">
      <ConfirmModal
        title={t("delete.label")}
        description={t("delete.description")}
        open={openConfirm}
        setOpen={() => setOpenConfirm(!openConfirm)}
        onConfirm={handleDelete}
        onCancel={() => setOpenConfirm(false)}
      />

      <InvitationModal open={open} setOpen={setOpen} />
      <h1 className="font-medium text-3xl">{t("label")}</h1>
      <div className="-mt-6">
        <div className="flex flex-row-reverse">
          <Button
            disabled={checked ? checked.length === 0 : true}
            variant="plain"
            onClick={() => setOpenConfirm(true)}
          >
            <p className="underline font-medium">{t("actions.delete")}</p>
          </Button>
        </div>
        <TableWithCheckBox
          data={data?.data}
          isLoading={isLoading}
          isSuccess={isSuccess}
          checkboxMethods={checkboxMethods}
          setOpen={setOpen}
          editColumn={false}
          columns={[
            {
              key: "fullName",
              label: t("fields.name"),
              render: (r) => {
                return (
                  <div className="flex items-center gap-2">
                    <ChangableAvatar
                      allowRemove={false}
                      editable={false}
                      src={r.imageUrl}
                      size={28}
                    />
                    <p>
                      {r.fullName}{" "}
                      {user?.primaryEmailAddress?.emailAddress === r.email &&
                        `( ${t("info.you")} )`}
                    </p>
                  </div>
                );
              },
            },
            { key: "email", label: t("fields.email") },
            {
              key: "lastSigninAt",
              label: t("fields.last_signin_at"),
              render: (r) =>
                r.lastSignInAt == null
                  ? "—"
                  : formatModifiedTime(new Date(r.lastSignInAt), tDate),
            },
          ]}
        />
        <div className="mt-4 flex gap-4">
          <Button onClick={() => setOpen(true)}>{t("actions.invite")}</Button>
          {/* <Button onClick={()=>setOpen(true)} variant="outlined" color="danger">Leave Shop</Button> */}
        </div>
      </div>
    </div>
  );
}
