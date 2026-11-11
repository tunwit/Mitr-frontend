"use client";

import Breadcrumbs from "@/widget/Breadcrumbs";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useZodForm } from "@/lib/useZodForm";
import { branchSchema } from "@/schemas/setting/branchForm";
import { InputForm } from "@/widget/InputForm";
import { FormProvider } from "react-hook-form";
import { showError, showSuccess } from "@/utils/showSnackbar";
import { Button } from "@mui/joy";
import { useCreateBranch } from "@/hooks/hook.branch";
import { NewBranchDTO } from "@/types/type.branch";
import { Link } from "@/i18n/navigation";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";

export default function SetupBranchPage() {
  const router = useRouter();
  const { id: shopId, name } = useCurrentShop();
  const tb = useTranslations("breadcrumb");
  const method = useZodForm(branchSchema);
  const { mutateAsync } = useCreateBranch();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
  } = method;

  const onSubmit = async (data: Omit<NewBranchDTO, "shopId">) => {
    if (!shopId) return;

    try {
      await mutateAsync({
        shopId: Number(shopId),
        payload: {
          name: data.name,
          nameEng: data.nameEng,
          address: data.address,
        },
      });

      // Redirect back to shop page after successful creation
      showSuccess("Create branch successful");
      router.push(`/`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="page-gutter flex h-full w-full flex-col items-center gap-5 overflow-y-auto bg-gray-50 py-10">
      <Breadcrumbs
        className="w-full"
        items={[{ label: name }, { label: tb("setup_branch") }]}
      />
      <div className="my-auto max-w-md w-full bg-white rounded-lg shadow-lg p-8 ">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Setup Your First Branch
          </h1>
          <p className="text-gray-600 mt-2">
            Your shop needs at least one branch to get started
          </p>
        </div>
        <FormProvider {...method}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <InputForm
              control={control}
              name="name"
              label="Branch Name"
              placeHolder="e.g., Main Branch, สาขาหลัก"
            />

            <InputForm
              control={control}
              name="nameEng"
              label="Branch Name (English)"
              placeHolder="e.g., Main Branch"
            />

            <InputForm
              control={control}
              name="address"
              label="Address"
              placeHolder="e.g., 56/458 Queen street"
            />

            <Button
              type="submit"
              disabled={isSubmitting || isSubmitSuccessful}
              loadingPosition="start"
              loading={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating Branch..." : "Create Branch"}
            </Button>
          </form>
        </FormProvider>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Need help?{" "}
            <Link href="/support" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
