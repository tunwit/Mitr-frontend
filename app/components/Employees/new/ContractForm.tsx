"use client";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Button,
  FormControl,
  FormLabel,
} from "@mui/joy";
import React, { useEffect } from "react";
import BankSelector from "../../../../widget/BankSelector";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contractSchema } from "@/schemas/createEmployeeForm/contractForm";
import BranchSelector from "@/widget/BranchSelector";
import StatusSelector from "@/widget/StatusSelector";
import { EMPLOYEE_STATUS } from "@/types/enum/enum";
import { InputForm } from "@/widget/InputForm";
import { createEmployeeFormSchema } from "@/types/formField";
import { ZodForm } from "@/lib/useZodForm";
import dayjs from "dayjs";
import DatePickerLocalize from "@/widget/DatePickerLocalize";
import { useTranslations } from "next-intl";
import PreferredPaymentMethodField from "../PreferredPaymentMethodField";
import SocialSecurityFields from "../SocialSecurityFields";

interface ContractFormProps {
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function ContractForm({ setCurrentPage }: ContractFormProps) {
  type FormField = z.infer<typeof contractSchema>;

  const {
    register,
    control,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useFormContext<z.infer<typeof createEmployeeFormSchema>>() as ZodForm<
    typeof createEmployeeFormSchema
  >;
  const t = useTranslations("employees");
  const tn = useTranslations("new_employees");

  const handlerPrevious = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  useEffect(() => {}, [isSubmitting]);
  return (
    <>
      <div className="grid grid-cols-4 gap-x-3 gap-y-5 mt-4 px-5">
        <div className="col-span-2">
          <InputForm
            control={control}
            name="salary"
            label={t("fields.base_salary")}
            type="number"
          />
        </div>

        <div className="col-span-2">
          <InputForm
            control={control}
            name="position"
            label={t("fields.postion")}
          />
        </div>

        <div className="col-span-1 ">
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
                  onChange={(newvalue) => field.onChange(newvalue!.toDate())}
                />
              )}
            />
          </FormControl>
        </div>

        <div className="col-span-2">
          <PreferredPaymentMethodField />
        </div>

        <div className="col-span-1 ">
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
                <BankSelector bank={field.value} onChange={field.onChange} />
              )}
            />
          </FormControl>
        </div>

        <div className="col-span-2">
          <InputForm
            control={control}
            name="bankAccountNumber"
            label={t("fields.bank_account_number")}
          />
        </div>
        <div className="col-span-2">
          <InputForm control={control} name="bankBranchCode" label={t("fields.bank_branch_code")} />
              <InputForm
            control={control}
            name="bankAccountOwner"
            label={t("fields.bank_account_owner")}
          />
        </div>

        <div className="col-span-2">
          <InputForm
            control={control}
            name="promtpay"
            label={t("fields.promtpay")}
          />
        </div>
        <div className="col-span-2">
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
                <BranchSelector
                  branchId={field.value || -1}
                  onChange={field.onChange}
                />
              )}
            />
          </FormControl>
        </div>
        <div className="col-span-2">
          <FormControl required>
            <FormLabel>
              {t("fields.status")}
              {errors.status && (
                <p className="text-xs ml-2 font-normal text-red-500 italic">
                  {errors.status.message}
                </p>
              )}
            </FormLabel>
            <Controller
              control={control}
              name="status"
              defaultValue={EMPLOYEE_STATUS.ACTIVE}
              render={({ field }) => (
                <StatusSelector
                  status={field.value ? field.value : null}
                  onChange={(newvalue) => field.onChange(newvalue!)}
                />
              )}
            />
          </FormControl>
        </div>
        <SocialSecurityFields />
      </div>

      <div className="flex justify-end items-center mt-5 gap-3 mr-5">
        <Button onClick={(e) => handlerPrevious(e)} variant="outlined">
          <Icon className="text-lg" icon={"mingcute:left-line"} />
          <p>{tn("action.previous")}</p>
        </Button>
        <Button
          type="submit"
          variant="solid"
          loading={isSubmitting}
          loadingPosition="start"
          disabled={isSubmitting || isSubmitSuccessful}
        >
          {isSubmitting ? tn("action.creating") : tn("action.create")}
          <Icon className="text-lg" icon={"mingcute:right-line"} />
        </Button>
      </div>
    </>
  );
}
