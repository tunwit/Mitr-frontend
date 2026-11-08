import { NativeInput } from "@/widget/Input";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import getFileIcon from "@/lib/getFileIcon";
import { formatBytes } from "@/lib/unitConverter";
import uploadDocmentValidator from "@/lib/uploadDocmentValidator";
import { ApiResponse } from "@/types/response";
import { CreateDocResultDTO } from "@/types/type.document";

import { useUser } from "@clerk/nextjs";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Button,
  LinearProgress,
  Modal,
  ModalClose,
  ModalDialog,
} from "@mui/joy";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";

interface FileProgress {
  fileName: string;
  progress: "uploading" | "uploaded";
  success?: boolean;
  error?: any;
}

const filesLimit = 10;
const filesSizeLimit = 10 * 1024 * 1024;

interface UploadDocumentModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  tag: string;
  targetId: number; // employeeId or shopId
  onUpload: (
    files: File[],
    tag: string,
    targetId: number,
  ) => Promise<ApiResponse<CreateDocResultDTO[]>>;
}

export default function UploadDocumentModal({
  open,
  setOpen,
  tag,
  targetId,
  onUpload,
}: UploadDocumentModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useUser();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [progressList, setProgressList] = useState<FileProgress[]>([]);
  const queryClient = useQueryClient();
  const { id: shopId } = useCurrentShop();
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("documents");

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setFiles([...files, ...Array.from(e.dataTransfer.files)]);
  };

  const onUploadHandler = async () => {
    if (!user?.id || !shopId) return;
    setIsUploading(true);
    setError("");

    const existingProgress = progressList.filter(
      (p) => p.progress === "uploaded" && p.success,
    );
    const uploadedFileNames = existingProgress.map((p) => p.fileName);
    const filesToUpload = files.filter(
      (f) => !uploadedFileNames.includes(f.name),
    );

    if (!filesToUpload.length) {
      setIsUploading(false);
      return;
    }

    const newProgress = filesToUpload.map((f) => ({
      fileName: f.name,
      progress: "uploading" as const,
    }));
    setProgressList([...existingProgress, ...newProgress]);

    try {
      const results = await onUpload(filesToUpload, tag, targetId);

      setProgressList((prev) =>
        prev.map((p) => {
          const result = results?.data?.find((r) => r.fileName === p.fileName);
          if (!result?.success) {
            setError(result?.errorMessage || "");
          }
          if (result)
            return {
              fileName: p.fileName,
              progress: "uploaded",
              success: result.success,
              error: result.errorMessage,
            };
          return p;
        }),
      );
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Network error";
      setProgressList((prev) =>
        prev.map((p) =>
          p.progress === "uploading"
            ? { ...p, progress: "uploaded", success: false, error: msg }
            : p,
        ),
      );
    } finally {
      setIsUploading(false);
      queryClient.invalidateQueries({
        queryKey: ["employees", "document", targetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["shop", "document"],
        exact: false,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const incoming = Array.from(e.target.files);
    if (incoming.length + files.length > filesLimit) {
      setError(`Exceed file limit (${filesLimit})`);
      return;
    }

    const validator = uploadDocmentValidator(incoming);

    if (!validator.success) {
      setError(validator.message);
      return;
    }

    const newFiles = incoming.filter(
      (f) =>
        !files.some(
          (existing) =>
            existing.name === f.name &&
            existing.size === f.size &&
            existing.type === f.type,
        ),
    );
    const duplicates = incoming.filter((f) => !newFiles.includes(f));

    if (newFiles.length) setFiles((prev) => [...prev, ...newFiles]);
    if (duplicates.length)
      setError(
        `Duplicate file(s): ${duplicates.map((f) => f.name).join(", ")}`,
      );
    e.target.value = "";
  };

  const onBrowseClick = () => inputRef.current?.click();

  const statusSpan = {
    failed: (
      <span className="flex flex-row gap-1 items-center">
        <Icon icon="mdi:cross-circle" className="text-red-600" fontSize={15} />
        <p className="text-xs">{t("upload.status.failed")}</p>
      </span>
    ),
    ready: (
      <span className="flex flex-row gap-1 items-center">
        <Icon icon="mdi:cloud-upload" className="text-blue-600" fontSize={15} />
        <p className="text-xs">{t("upload.status.ready")}</p>
      </span>
    ),
    uploading: (
      <span className="flex flex-row gap-1 items-center">
        <Icon icon="ph:spinner" className="animate-spin" fontSize={15} />
        <p className="text-xs">{t("upload.status.uploading")}</p>
      </span>
    ),
    uploaded: (
      <span className="flex flex-row gap-1 items-center">
        <Icon
          icon="lets-icons:check-fill"
          fontSize={15}
          className="text-green-600"
        />
        <p className="text-xs">{t("upload.status.uploaded")}</p>
      </span>
    ),
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog>
        <ModalClose />
        <h1 className="font-bold text-xl">{t("upload.label")}</h1>
        <section>
          <div
            className={`relative flex flex-col gap-2 justify-center items-center min-w-96 min-h-56 border border-dashed rounded-md ${isDragOver ? "border-2 border-green-700" : "border-gray-400"}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragLeave={onDragLeave}
          >
            <div
              className={`absolute inset-[0.4px] flex flex-col justify-center items-center w-full h-full z-10 font-bold text-2xl bg-green-600/50 transition-all backdrop-blur-md rounded-md ${isDragOver ? "opacity-95 " : "opacity-0 pointer-events-none"}`}
            >
              <Icon
                className="mb-2 opacity-70 animate-bounce"
                icon="ic:round-download"
                fontSize={50}
              />
              <p className="text-black">{t("upload.dropzone.drop_here")}</p>
            </div>

            {files.length >= filesLimit && (
              <div className="absolute inset-[0.4px] flex flex-col justify-center items-center w-full h-full z-10 font-bold text-2xl bg-red-400/50 transition-all backdrop-blur-md rounded-md opacity-95">
                <Icon
                  className="mb-2 opacity-70 text-red-800"
                  icon="ion:ban"
                  fontSize={50}
                />
                <p className="text-black">{t("upload.info.file_limit")}</p>
                <p className="mt-1 text-sm font-normal">
                  {t("upload.info.file_limit_description", {
                    filesLimit: filesLimit,
                  })}
                </p>
              </div>
            )}

            <Icon
              className="mb-2 opacity-70"
              icon="line-md:upload-loop"
              fontSize={50}
            />
            <h1 className="font-semibold opacity-70">
              {t("upload.dropzone.title")}
            </h1>
            <p className="text-sm opacity-50">
              {t("upload.dropzone.description")}
            </p>
            <Button color="neutral" size="sm" onClick={onBrowseClick}>
              {t("actions.browse")}
            </Button>
            <NativeInput
              ref={inputRef}
              disabled={files.length >= filesLimit}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex flex-row justify-between">
            <p className="text-xs text-gray-400 font-light mt-2">
              {t("upload.info.support_format")}
            </p>
            <p className="text-xs text-gray-400 font-light mt-2">
              {t("upload.info.filesize_limit")}: {filesSizeLimit / 1024 / 1024}
              MB
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-2 mt-2 overflow-hidden ">
          <span className="flex flex-row gap-2">
            <p
              className={` text-xs ${files.length >= filesLimit ? "text-red-900" : "text-gray-400"}`}
            >
              {files.length} / {filesLimit}
            </p>
            <p className="text-xs text-red-900">{error}</p>
          </span>

          <div className="flex flex-col gap-2 overflow-y-auto">
            {files.map((f, index) => {
              const item = progressList[index];

              let status = statusSpan.ready;
              if (!item) {
                status = statusSpan.ready;
              } else if (item?.success === false) {
                status = statusSpan.failed;
              } else if (item?.success === true) {
                status = statusSpan.uploaded;
              } else if (item?.progress) {
                status = statusSpan.uploading;
              }
              return (
                <div
                  className="relative bg-gray-200 p-3 w-full rounded-lg"
                  key={index}
                >
                  <button
                    hidden={progressList[index]?.progress !== undefined}
                    className="absolute right-3 bg-white border rounded-full"
                    onClick={() =>
                      setFiles(files.filter((_, i) => i !== index))
                    }
                  >
                    <Icon icon="basil:cross-solid" fontSize={15} />
                  </button>
                  <div className="flex flex-row gap-2 mb-2 items-center">
                    <img src={getFileIcon(f.name)} width={30} />
                    <div className="flex flex-col">
                      <p className="font-semibold text-sm truncate max-w-[95%] ">
                        {f.name}
                      </p>
                      <div className="flex flex-row gap-2">
                        <p className="text-xs text-gray-500">
                          {t("upload.info.size")} {formatBytes(f.size)}
                        </p>
                        {status}
                      </div>
                    </div>
                  </div>
                  <LinearProgress
                    hidden={progressList[index]?.progress !== "uploading"}
                    sx={{ marginTop: "8px" }}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex gap-3 flex-row-reverse mt-2">
          <Button
            disabled={
              !files.length ||
              isUploading ||
              progressList.length === files.length
            }
            loading={isUploading}
            onClick={onUploadHandler}
          >
            {t("actions.upload")}
          </Button>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            {t("actions.cancel")}
          </Button>
        </section>
      </ModalDialog>
    </Modal>
  );
}
