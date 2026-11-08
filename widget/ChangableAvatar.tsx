import { NativeInput } from "@/widget/Input";
import { Icon } from "@iconify/react/dist/iconify.js";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";

interface AvatarProps {
  src?: string;
  fallbackTitle?: string;
  size?: number;
  onChange?: (file?: File) => void;
  onRemove?: () => void;
  editable?: boolean;
  allowRemove?: boolean;
}
export default function ChangableAvatar({
  src,
  fallbackTitle,
  size = 38,
  onChange,
  onRemove,
  editable = false,
  allowRemove = true,
}: AvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  const displayUrl = src ?? localUrl;

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (!editable) return;
    fileInputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editable) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const blobUrl = URL.createObjectURL(file);
    objectUrlRef.current = blobUrl;

    setHasError(false);
    setLocalUrl(blobUrl);
    onChange?.(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!allowRemove) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setLocalUrl(undefined);
    onRemove?.();
  };

  function colorFromText(text?: string) {
    if (!text) return "#CDD7E1";
    const colors = ["#97C3F0", "#A1E8A1", "#F3C896", "#F09898"] as const;
    return colors[text.charCodeAt(0) % colors.length];
  }

  return (
    <>
      <div
        style={{ width: size, height: size }}
        className={editable ? "cursor-pointer" : "cursor-default"}
        onClick={handleClick}
      >
        <div className="relative w-full h-full group aspect-square">
          {displayUrl && !hasError ? (
            <div className="relative w-full h-full overflow-hidden rounded-full">
              <Image
                key={displayUrl}
                src={displayUrl}
                alt="avatar"
                fill
                unoptimized
                className="object-cover"
                onError={() => setHasError(true)}
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center w-full h-full rounded-full"
              style={{ backgroundColor: colorFromText(fallbackTitle) }}
            >
              {fallbackTitle ? (
                <span style={{ fontSize: size / 2 }}>
                  {fallbackTitle[0].toUpperCase()}
                </span>
              ) : (
                <Icon icon="mdi:user" fontSize={size - 12} />
              )}
            </div>
          )}

          {editable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition">
              <Icon icon="tdesign:edit-filled" className="text-white" />
              {allowRemove && displayUrl && (
                <div
                  onClick={handleRemove}
                  className="absolute top-1 right-1 bg-gray-800 rounded-full p-1"
                >
                  <Icon icon="ic:baseline-delete" className="text-red-400" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <NativeInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        disabled={!editable}
        onChange={handleChange}
      />
    </>
  );
}
