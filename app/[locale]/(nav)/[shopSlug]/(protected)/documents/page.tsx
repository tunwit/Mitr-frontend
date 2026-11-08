"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { SearchInput } from "@/widget/Input";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import DocumentTable from "@/widget/Documents/DocumentTable";
import { useUser } from "@clerk/nextjs";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { Modal, ModalDialog } from "@mui/joy";
import { useTranslations } from "next-intl";
import { useDocuments } from "@/hooks/hook.document";
import { DocumentPublicDTO } from "@/types/type.document";

export default function Document() {
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 500);
  const { id: shopId } = useCurrentShop();
  const { user } = useUser();
  const shopDoc = useDocuments("shop", shopId || -1);
  const { data, isLoading } = shopDoc.list;
  const { name } = useCurrentShop();
  const tb = useTranslations("breadcrumb");
  const t = useTranslations("documents");

  const onRename = async (doc: DocumentPublicDTO, newName: string) => {
    if (!shopId || !user?.id) return;
    try {
      await shopDoc.rename.mutateAsync({
        documentId: doc.id,
        payload: { newName: newName },
      });
    } catch (err) {
      showError(`cannot rename ${err}`);
    }
  };

  const onUpload = async (files: File[], tag: string, targetId: number) => {
    if (!shopId || !user?.id) return [];

    const result = await shopDoc.create.mutateAsync({
      payload: { files: files, tag: tag },
    });

    return result;
  };

  const onDelete = async (doc: DocumentPublicDTO) => {
    if (!shopId || !user) return;
    await shopDoc.remove.mutateAsync({ documentId: doc.id });
    showSuccess("Deleted");
  };

  const onClickUrl = async (doc: DocumentPublicDTO) => {
    const result = await shopDoc.getPresign.mutateAsync({
      payload: { id: doc.id },
    });
    if (!result.data?.url) return;

    window.open(result.data?.url, "_blank", "noopener,noreferrer");
  };

  const onCopy = async (doc: DocumentPublicDTO) => {
    const result = await shopDoc.getPresign.mutateAsync({
      payload: { id: doc.id },
    });
    if (!result.data?.url) return;
    navigator.clipboard.writeText(result.data?.url);
  };

  return (
    <>
      <title>Documents - Mitr</title>
      <Modal open={isLoading}>
        <ModalDialog>
          <div className="flex flex-col items-center justify-center">
            <Icon
              icon={"mynaui:spinner"}
              className="animate-spin"
              fontSize={50}
            />

            <p>{t("load.loading_doc")}...</p>
          </div>
        </ModalDialog>
      </Modal>
      <main className="w-full h-full  font-medium overflow-auto py-10">
        <div className="mx-10">
          <Breadcrumbs
            items={[
              { label: name },
              { label: tb("dashboard") },
              { label: tb("documents") },
            ]}
          />
          <div className=" mt-5 flex flex-row justify-between">
            <p className="text-black text-4xl font-bold">{t("label")}</p>
          </div>

          <div className="mt-8 flex flex-row gap-2">
            <div className="w-full">
              <p className="text-black text-xs mb-1">{t("search.label")}</p>
              <SearchInput
                type="text"
                placeholder={t("search.placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center mt-5">
            <DocumentTable
              title=""
              tag="files"
              isLoading={isLoading}
              onClickUrl={onClickUrl}
              data={data?.data || []}
              targetId={shopId || -1}
              onCopy={onCopy}
              onRename={async (doc, newName) => onRename(doc, newName)}
              onUpload={async (files: File[], tag: string, targetId: number) =>
                onUpload(files, tag, targetId)
              }
              onDelete={async (doc) => onDelete(doc)}
            />
          </div>
        </div>
      </main>
    </>
  );
}
