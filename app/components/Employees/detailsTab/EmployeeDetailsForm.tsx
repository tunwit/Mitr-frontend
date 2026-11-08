"use client";
import { TextInput } from "@/widget/Input";
import { Button, FormControl, FormLabel } from "@mui/joy";
import React, { Suspense, useState } from "react";
import BranchSelector from "../../../../widget/BranchSelector";
import { EmployeeDetailedDTO } from "@/types/type.employee";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { createEmployeeFormSchema } from "@/types/formField";
import GenderSelector from "@/widget/GenderSelector";
import DatePickerLocalize from "@/widget/DatePickerLocalize";
import dayjs from "dayjs";
import BankSelector from "@/widget/BankSelector";
import { ZodForm } from "@/lib/useZodForm";
import { InputForm } from "@/widget/InputForm";
import { z } from "zod";
import { useTranslations } from "next-intl";
import QRPromptpayModal from "./QRPromptpayModal";

export default function EmployeeDetailsForm({
  employee,
}: {
  employee: EmployeeDetailedDTO;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useFormContext<z.infer<typeof createEmployeeFormSchema>>() as ZodForm<
    typeof createEmployeeFormSchema
  >;
  const [showQR, setShowQR] = useState(false);
  const tn = useTranslations("new_employees");
  const t = useTranslations("employees");
  const currentText = useWatch({
    control,
    name: "promtpay",
  });
  return (
    <>
      <QRPromptpayModal
        open={showQR}
        setOpen={setShowQR}
        promptpay={currentText || null}
      />
      <form>
        <div className="flex flex-col gap-3 ">
          <div className="bg-white rounded-md border border-gray-300 py-4 px-4">
            <p className="font-semibold mb-2">{tn("steps.personal_info")}</p>
            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
              <InputForm
                control={control}
                name="email"
                label={t("fields.email")}
              />
              <InputForm
                control={control}
                name="firstName"
                label={t("fields.first_name")}
              />
              <InputForm
                control={control}
                name="lastName"
                label={t("fields.last_name")}
              />
              <InputForm
                control={control}
                name="nickName"
                label={t("fields.nickname")}
              />
              <FormControl required>
                <FormLabel>
                  {t("fields.gender")}
                  {errors.gender && (
                    <p className="text-xs ml-2 font-normal text-red-500 italic">
                      {errors.gender.message}
                    </p>
                  )}
                </FormLabel>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Suspense>
                      <GenderSelector
                        gender={field.value ? field.value : null}
                        onChange={field.onChange}
                      />
                    </Suspense>
                  )}
                />
              </FormControl>
              <InputForm
                control={control}
                name="phoneNumber"
                label={t("fields.phone_number")}
              />
              <FormControl required>
                <FormLabel>
                  {t("fields.date_of_birth")}
                  {errors.dateOfBirth && (
                    <p className="text-xs ml-2 font-normal text-red-500 italic">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </FormLabel>
                <Controller
                  control={control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <DatePickerLocalize
                      date={dayjs(field.value)}
                      onChange={(newvalue) =>
                        field.onChange(newvalue!.toDate())
                      }
                    />
                  )}
                />
              </FormControl>
            </div>
          </div>

          <div className="bg-white rounded-md border border-gray-300 py-4 px-4">
            <p className="font-semibold mb-2">{tn("steps.address")}</p>
            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
              <InputForm
                control={control}
                name="address1"
                label={t("fields.address_line1")}
              />
              <InputForm
                control={control}
                name="address2"
                label={t("fields.address_line2")}
              />
              <InputForm
                control={control}
                name="address3"
                label={t("fields.address_line3")}
              />
            </div>
          </div>

          <div className="bg-white rounded-md border border-gray-300 py-4 px-4">
            <p className="font-semibold mb-2">{tn("steps.contract")}</p>
            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
              <InputForm
                control={control}
                name="salary"
                label={t("fields.base_salary")}
                type="number"
              />
              <InputForm
                control={control}
                name="position"
                label={t("fields.postion")}
              />

              <FormControl required>
                <FormLabel>
                  {t("fields.date_of_employ")}
                  {errors.dateEmploy && (
                    <p className="text-xs ml-2 font-normal text-red-500 italic">
                      {errors.dateEmploy.message}
                    </p>
                  )}
                </FormLabel>
                <Controller
                  control={control}
                  name="dateEmploy"
                  render={({ field }) => (
                    <DatePickerLocalize
                      date={dayjs(field.value)}
                      onChange={(newvalue) =>
                        field.onChange(newvalue!.toDate())
                      }
                    />
                  )}
                />
              </FormControl>
              <FormControl required>
                <FormLabel>
                  {t("fields.branch")}
                  {errors.branchId && (
                    <p className="text-xs ml-2 font-normal text-red-500 italic">
                      {errors.branchId.message}
                    </p>
                  )}
                </FormLabel>
                <Controller
                  control={control}
                  name="branchId"
                  render={({ field }) => (
                    <Suspense>
                      <BranchSelector
                        branchId={field.value || -1}
                        onChange={field.onChange}
                      />
                    </Suspense>
                  )}
                />
              </FormControl>
              <FormControl required>
                <FormLabel>
                  {t("fields.bank")}
                  {errors.bankName && (
                    <p className="text-xs ml-2 font-normal text-red-500 italic">
                      {errors.bankName.message}
                    </p>
                  )}
                </FormLabel>
                <Controller
                  control={control}
                  name="bankName"
                  render={({ field }) => (
                    <BankSelector
                      bank={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormControl>
              <InputForm
                control={control}
                name="bankAccountNumber"
                label={t("fields.bank_account_number")}
              />
              <InputForm control={control} name="bankBranchCode" label={t("fields.bank_branch_code")} />
              <InputForm
                control={control}
                name="bankAccountOwner"
                label={t("fields.bank_account_owner")}
              />
              <FormControl required>
                <FormLabel>
                  {t("fields.promtpay")}
                  {errors.bankName && (
                    <p className="text-xs ml-2 font-normal text-red-500 italic">
                      {errors.bankName.message}
                    </p>
                  )}
                </FormLabel>
                <Controller
                  control={control}
                  name="promtpay"
                  render={({ field }) => (
                    <TextInput
                      endDecorator={
                        <Button
                          variant="outlined"
                          onClick={() => setShowQR(!showQR)}
                        >
                          show QR
                        </Button>
                      }
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormControl>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
