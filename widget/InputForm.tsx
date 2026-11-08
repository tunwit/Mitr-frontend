import { Controller, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { ZodControl } from "@/lib/useZodForm"; // import type from above
import { TextInput } from "@/widget/Input";

interface InputFormProps<TSchema extends z.ZodTypeAny> {
  control: ZodControl<TSchema>;
  name: FieldPath<z.infer<TSchema>>;
  label: string;
  placeHolder?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
}

export function InputForm<TSchema extends z.ZodTypeAny>({
  control,
  name,
  label,
  placeHolder = label,
  disabled = false,
  required,
  type = "text",
}: InputFormProps<TSchema>) {
  const shape = control.schema._def.shape();
  const fieldSchema = shape[name as string];
  const isRequired = fieldSchema && !fieldSchema.isOptional();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextInput
          {...field}
          label={label}
          errorMessage={fieldState.error?.message}
          required={required ? required : isRequired}
          onChange={(e) =>
            field.onChange(
              type === "number" ? e.target.valueAsNumber : e.target.value,
            )
          }
          disabled={disabled}
          type={type}
          placeholder={placeHolder}
        />
      )}
    />
  );
}
