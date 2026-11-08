"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import JoyInput, { type InputProps } from "@mui/joy/Input";
import { FormControl, FormHelperText, FormLabel } from "@mui/joy";
import { Icon } from "@iconify/react/dist/iconify.js";
import { cn } from "@/lib/utils";

export { default as TextArea } from "@mui/joy/Textarea";

export function TextInput({
  label,
  errorMessage,
  required,
  error,
  ...props
}: InputProps & {
  label?: ReactNode;
  errorMessage?: string;
}) {
  const invalid = errorMessage ? true : error;
  const input = <JoyInput {...props} required={required} error={invalid} />;

  if (!label && !errorMessage) return input;

  return (
    <FormControl required={required} error={invalid}>
      {label && (
        <FormLabel>
          {label}
          {errorMessage && (
            <span className="text-xs ml-2 font-normal text-red-500 italic">
              {errorMessage}
            </span>
          )}
        </FormLabel>
      )}
      {input}
      {!label && errorMessage && (
        <FormHelperText>{errorMessage}</FormHelperText>
      )}
    </FormControl>
  );
}

type NativeInputProps = ComponentPropsWithRef<"input"> & {
  appearance?: "plain" | "table";
};

export function NativeInput({
  appearance = "plain",
  className,
  ...props
}: NativeInputProps) {
  return (
    <input
      {...props}
      className={cn(
        appearance === "table" && "px-2 py-1 w-full rounded",
        appearance === "table" &&
          (props.readOnly ? "bg-gray-200 cursor-not-allowed" : "border"),
        className,
      )}
    />
  );
}

export function SearchInput({
  stretch = false,
  className,
  ...props
}: ComponentPropsWithRef<"input"> & {
  stretch?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-1 bg-[#fbfcfe] px-2 rounded-sm border border-[#c8cfdb] shadow-xs",
        stretch ? "h-full" : "py-[7px]",
      )}
    >
      <Icon
        className="text-[#424242]"
        icon="material-symbols:search-rounded"
        aria-hidden="true"
      />
      <NativeInput
        type="text"
        {...props}
        aria-label={props["aria-label"] ?? props.placeholder}
        className={cn(
          "text-[#424242] font-light text-sm w-full focus:outline-none",
          className,
        )}
      />
    </div>
  );
}
