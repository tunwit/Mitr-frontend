import { TextInput } from "@/widget/Input";
import { DocumentPublicDTO } from "@/types/type.document";
import { Button, Modal, ModalClose, ModalDialog } from "@mui/joy";
import { useTranslations } from "next-intl";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

interface RenameModalProps<T extends DocumentPublicDTO> {
  doc: T;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onRename: (doc: T, newName: string) => Promise<void>;
}

export default function RenameModal<T extends DocumentPublicDTO>({
  doc,
  open,
  setOpen,
  onRename,
}: RenameModalProps<T>) {
  const [newName, setNewName] = useState(doc?.fileName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("documents");
  useEffect(() => {
    setNewName(doc?.fileName);
  }, [doc?.fileName]);

  const onConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newName === doc.fileName) return;
    setIsSubmitting(true);
    try {
      await onRename(doc, newName);
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog>
        <ModalClose />
        <h1 className="font-bold text-xl">{t("rename.label")}</h1>
        <form onSubmit={onConfirm}>
          <section>
            <TextInput
              onChange={(e) => setNewName(e.target.value)}
              value={newName}
              placeholder="rename"
            />
          </section>
          <section className="flex flex-row-reverse gap-3 mt-2">
            <Button
              type="submit"
              disabled={!newName || isSubmitting}
              loading={isSubmitting}
            >
              {t("actions.confirm")}
            </Button>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
          </section>
        </form>
      </ModalDialog>
    </Modal>
  );
}
