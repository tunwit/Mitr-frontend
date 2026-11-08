import React, { Dispatch, SetStateAction } from "react";
import PersonalForm from "./PersonalForm";
import AddressForm from "./AddressForm";
import ContractForm from "./ContractForm";
import { FormProvider } from "react-hook-form";
import { z } from "zod";
import { personalSchema } from "@/schemas/createEmployeeForm/personalForm";
import { addressSchema } from "@/schemas/createEmployeeForm/addressForm";
import { contractSchema } from "@/schemas/createEmployeeForm/contractForm";
import { usePathname, useRouter } from "next/navigation";
import { NewEmployeeDTO } from "@/types/type.employee";
import { useZodForm } from "@/lib/useZodForm";
import { useTranslations } from "next-intl";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { useCreateEmployee } from "@/hooks/hook.employee";
import { EMPLOYEE_STATUS, GENDER } from "@/types/enum/enum.employee";
import { useBranches } from "@/hooks/hook.branch";

interface FormSectionProps {
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

const formPages = [
  { titleKey: "personal_info", component: PersonalForm },
  { titleKey: "address", component: AddressForm },
  { titleKey: "contract", component: ContractForm },
];

const createEmployeeFormSchema = personalSchema
  .merge(addressSchema)
  .merge(contractSchema);
type FormField = z.infer<typeof createEmployeeFormSchema>; // This is the type RHF provides

export default function FormSection({
  currentPage,
  setCurrentPage,
}: FormSectionProps) {
  const { data } = useBranches();
  const methods = useZodForm(createEmployeeFormSchema, {
    defaultValues: {
      firstName: "",
      lastName: "",
      nickName: "",
      gender: GENDER.MALE,
      dateOfBirth: new Date(),
      email: "",
      phoneNumber: "",
      // address
      address1: "",
      address2: "",
      address3: "",
      // contract
      salary: 0,
      position: "",
      dateEmploy: new Date(),
      bankName: "",
      bankAccountNumber: "",
      bankBranchCode: "",
      bankAccountOwner: "",
      promtpay: "",
      status: EMPLOYEE_STATUS.ACTIVE,
      branchId: -1,
    },
  });

  const pathname = usePathname().split("/");
  const rounter = useRouter();
  const tn = useTranslations("new_employees");
  const tnm = useTranslations("new_employees.modal.create");
  const { mutateAsync: createMutate } = useCreateEmployee();

  const onSubmit = async (data: FormField) => {
    const valid = await methods.trigger();
    if (!valid) return;

    const employeePayload: NewEmployeeDTO = {
      ...data,
      dateEmploy: data.dateEmploy?.toISOString(),
      dateOfBirth: data.dateOfBirth?.toISOString(),
      avatar: undefined,
      salary: String(data.salary),
    };

    try {
      await createMutate({ payload: employeePayload });
      showSuccess(tnm("success"));
      rounter.push("/");
      methods.clearErrors();
      methods.reset();
    } catch (err: any) {
      methods.setError("firstName", {
        type: "server",
        message: "Backend error",
      });
      showError(tnm("fail", { err: err.message }));
    }
  };

  return (
    <div className="">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
          {formPages.map((value, index) => {
            const Component = value.component;
            return (
              <div key={index}>
                <p
                  hidden={currentPage !== index}
                  className="font-bold text-2xl mt-10"
                >
                  {tn(`steps.${value.titleKey}`)}
                </p>
                <div hidden={currentPage !== index}>
                  <Component setCurrentPage={setCurrentPage} />
                </div>
              </div>
            );
          })}
        </form>
      </FormProvider>
    </div>
  );
}
