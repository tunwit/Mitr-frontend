"use client";
import {
  Button,
  Modal,
  ModalClose,
  ModalDialog,
  Tab,
  tabClasses,
  TabList,
  TabPanel,
  Tabs,
} from "@mui/joy";
import React, { useEffect, useState } from "react";
import StatusSelector from "@/widget/StatusSelector";
import EmployeeStatusBadge from "./EmployeeStatusBadge";
import { useQueryClient } from "@tanstack/react-query";
import { FieldNamesMarkedBoolean, FormProvider } from "react-hook-form";
import { updateEmployeeFormSchema } from "@/types/formField";
import EmployeeDetailsForm from "./detailsTab/EmployeeDetailsForm";
import { EMPLOYEE_STATUS } from "@/types/enum/enum";
import { useZodForm } from "@/lib/useZodForm";
import normalizeNull from "@/utils/normallizeNull";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { useUser } from "@clerk/nextjs";
import EmployeeDetailsDocuments from "./documentsTab/EmployeeDetailsDocuments";
import EmployeePayrollDefaults from "./EmployeePayrollDefaults";
import { useTranslations } from "next-intl";
import ChangableAvatar from "@/widget/ChangableAvatar";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import {
  useChangeEmployeeAvatar,
  useEmployee,
  useUpdateEmployee,
} from "@/hooks/hook.employee";
import { UpdateEmployeeDTO } from "@/types/type.employee";
import { Icon } from "@iconify/react/dist/iconify.js";

interface EmployeeDetailsModalProps {
  employeeId: number;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function EmployeeDetailsModal({
  employeeId,
  open,
  setOpen,
}: EmployeeDetailsModalProps) {
  const { data, isLoading } = useEmployee(employeeId);
  const [status, setStatus] = useState<EMPLOYEE_STATUS | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | number>(0);
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { id: shopId } = useCurrentShop();
  const t = useTranslations("employees");
  const td = useTranslations("employee_payroll_defaults");
  const { mutateAsync: updateMutate } = useUpdateEmployee();
  const { mutateAsync: changeAvatarMutate } = useChangeEmployeeAvatar();

  const employee = data?.data;

  useEffect(() => {
    if (employee?.status) {
      setStatus(employee.status);
    }
  }, [employee?.status]);

  const handlerChangeStatus = async (newValue: EMPLOYEE_STATUS) => {
    if (!shopId || !employee) return;
    setStatus(newValue);
    try {
      await updateMutate({
        employeeId: employee.id,
        payload: {
          status: newValue,
        },
      });
      showSuccess(`Change Status to ${newValue} successful`);
    } catch (err) {
      showError(`Change Status failed\n${err}`);
    }
  };

  const methods = useZodForm(updateEmployeeFormSchema, {
    defaultValues: {},
    mode: "onChange",
    criteriaMode: "all",
  });
  const {
    handleSubmit,
    reset,
    formState: { dirtyFields, isDirty, errors },
  } = methods;

  useEffect(() => {
    if (!employee) return;

    reset(
      normalizeNull({
        avatar: employee.avatar,
        position: employee.position,
        firstName: employee.firstName,
        lastName: employee.lastName,
        nickName: employee.nickName,
        email: employee.email,
        dateOfBirth: employee.dateOfBirth
          ? new Date(employee.dateOfBirth)
          : undefined,
        phoneNumber: employee.phoneNumber,
        gender: employee.gender,
        branchId: employee.branch.id,
        address1: employee.address1,
        address2: employee.address2,
        address3: employee.address3,
        salary: Number(employee.salary) || 0,
        dateEmploy: employee.dateEmploy
          ? new Date(employee.dateEmploy)
          : undefined,
        bankName: employee.bankName,
        bankAccountNumber: employee.bankAccountNumber,
        bankBranchCode: employee.bankBranchCode,
        bankAccountOwner: employee.bankAccountOwner,
        promtpay: employee.promtpay,
        status: employee.status,
      }),
    );
  }, [employee]);

  function buildDirtyPayload<T extends Record<string, any>>(
    data: T,
    dirty: FieldNamesMarkedBoolean<T>,
  ): Partial<T> {
    const payload: Partial<T> = {};

    for (const key in dirty) {
      if (dirty[key]) {
        payload[key] = data[key];
      }
    }

    return payload;
  }

  const onSave = async (
    data: Omit<
      UpdateEmployeeDTO,
      "dateEmploy" | "dateOfBirth" | "avatar" | "salary"
    > & {
      dateEmploy?: Date;
      dateOfBirth?: Date;
      avatar?: File;
      salary: number;
    },
  ) => {
    console.log(shopId, employee);

    if (!shopId || !employee) return;

    const { salary, dateEmploy, dateOfBirth, ...rest } = buildDirtyPayload(
      data,
      dirtyFields,
    );

    try {
      await updateMutate({
        employeeId: employee.id,
        payload: {
          ...rest,
          ...(salary && {
            salary: String(salary),
          }),
          ...(dateEmploy && {
            dateEmploy: dateEmploy.toISOString(),
          }),
          ...(dateOfBirth && {
            dateOfBirth: dateOfBirth.toISOString(),
          }),
        },
      });
      setOpen(false);
      showSuccess(`update employee successful`);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (err) {
      showError(`Update employee failed failed\n${err}`);
    }
  };

  const handleSelectFile = async (file?: File) => {
    if (!file || !shopId || !user) return;
    try {
      setPreview(window.URL.createObjectURL(file));
      await changeAvatarMutate({
        employeeId: employeeId,
        payload: { file: file },
      });

      showSuccess("Change avatar sucessful");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (err) {
      console.log(err);

      showError(`Change avatar failed ${err}`);
    }
  };
  const handleRemove = async () => {
    if (!employee?.avatar || !shopId || !user) return;
    try {
      await changeAvatarMutate({
        employeeId: employeeId,
        payload: { file: null },
      });
      queryClient.invalidateQueries({
        queryKey: ["employees"],
        exact: false,
      });
      showSuccess("Remove avatar sucessful");
    } catch (err) {
      showError(`Remove avatar failed ${err}`);
    }
  };

  if (isLoading || !employee || employee.id !== employeeId)
    return <p>loading</p>;
  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} sx={{ zIndex: 100 }}>
        <ModalDialog
          sx={{
            background: "#fafafa",
            overflowY: "auto",
            maxHeight: "90dvh",
            width: { xs: "calc(100% - 24px)", md: "70%" },
            maxWidth: 1100,
          }}
        >
          <ModalClose />
          <div className="flex flex-row justify-between items-center ">
            <div className="flex flex-row gap-10 items-center p-2">
              <div className="flex gap-4  items-center">
                <ChangableAvatar
                  src={preview || data.data?.avatarUrl || ""}
                  editable={true}
                  size={80}
                  fallbackTitle={employee?.firstName?.charAt(0)}
                  onChange={handleSelectFile}
                  onRemove={handleRemove}
                />
              </div>

              <div className="flex flex-col gap-0 ">
                <div className="flex flex-row gap-2">
                  <p className="font-bold text-xl">
                    {employee?.firstName + " " + employee?.lastName}
                  </p>
                  <EmployeeStatusBadge
                    status={status || EMPLOYEE_STATUS.ACTIVE}
                  />
                  <StatusSelector
                    status={status || EMPLOYEE_STATUS.ACTIVE}
                    onChange={handlerChangeStatus}
                  />
                </div>
                <div className="grid grid-cols-2">
                  <p>EMP{String(employee?.id).padStart(3, "0")}</p>
                </div>
              </div>
            </div>
            <div className="ml-auto">
              {activeTab === 0 && (
                <Button
                  disabled={!isDirty}
                  onClick={handleSubmit(onSave)}
                  startDecorator={<Icon icon={"material-symbols:save"} />}
                  sx={{ fontSize: "12px", gap: 0 }}
                  size="sm"
                  variant="outlined"
                >
                  {t("actions.save")}
                </Button>
              )}
            </div>
          </div>

          <Tabs
            aria-label="Basic tabs"
            value={activeTab}
            onChange={(_, value) => {
              if (value !== null) setActiveTab(value);
            }}
            orientation="horizontal"
          >
            <TabList
              sx={{
                flexWrap: "wrap",
                [`& .${tabClasses.root}`]: {
                  fontSize: "sm",
                  fontWeight: "lg",
                  [`&[aria-selected="true"]`]: {
                    bgcolor: "background.surface",
                  },
                  [`&.${tabClasses.focusVisible}`]: {
                    outlineOffset: "-4px",
                  },
                },
              }}
            >
              <Tab>{t("tabs.details")}</Tab>
              <Tab>{t("tabs.documents")}</Tab>
              <Tab>{td("tab")}</Tab>
            </TabList>
            <TabPanel value={0}>
              <FormProvider {...methods}>
                <EmployeeDetailsForm employee={employee} />
              </FormProvider>
            </TabPanel>
            <TabPanel value={1}>
              <EmployeeDetailsDocuments
                title="Personal Documents"
                tag="personal"
                employeeId={employee?.id}
              />
            </TabPanel>
            <TabPanel value={2} keepMounted>
              <EmployeePayrollDefaults
                key={`${shopId}-${employee.id}`}
                employeeId={employee.id}
                enabled={open}
              />
            </TabPanel>
          </Tabs>
        </ModalDialog>
      </Modal>
    </>
  );
}
