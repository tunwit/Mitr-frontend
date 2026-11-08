import { NativeInput } from "@/widget/Input";
import { showError } from "@/utils/showSnackbar";
import { useUser } from "@clerk/nextjs";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Modal, ModalClose, ModalDialog } from "@mui/joy";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { usePeriod } from "@/hooks/payroll/period/hook.period";

interface ChangePasswordModalProps {
  periodId: number;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
export default function UnlockModal({
  periodId,
  open,
  setOpen,
}: ChangePasswordModalProps) {
  const { user } = useUser();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { mutateAsync: unlockAsync, error: UnlockError } =
    usePeriod(periodId).unlock;
  const t = useTranslations("view_payroll.unlock");

  const onUnlock = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setIsSubmitting(true);
    try {
      await unlockAsync({ payload: { password } });
      const newPath = pathname.replace("/summary", "/view");
      router.push(`${newPath}`);
      setOpen(false);
    } catch (err: any) {
      if (err.status === 401) {
        setError(t("modal.unlock.wrong_password"));
        return;
      } else {
        showError(t("modal.unlock.fail", { err: err.message }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalDialog sx={{ padding: 0, width: "30%" }}>
          <ModalClose />
          <form onSubmit={onUnlock} className="space-y-5">
            <section className="bg-orange-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="bg-orange-600 p-2 rounded-sm">
                  <Icon
                    icon="simple-line-icons:check"
                    fontSize={24}
                    className="text-white"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t("label")}
                  </h2>
                  <p className="text-sm text-gray-600">{t("description")}</p>
                </div>
              </div>
            </section>
            <section className="px-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  {t("password.label")}
                </h3>
                <div className="rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 w-full border border-gray-300 rounded-sm py-1 px-2 h-12">
                      <Icon icon="fluent:key-32-regular" fontSize={18} />
                      <NativeInput
                        type={`${showPassword ? "text" : "password"}`}
                        className="w-full font-ligh h-full focus:outline-0 font-light"
                        placeholder={t("password.placeholder")}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <Icon
                          icon={`mdi:eye-off-outline`}
                          className={`${showPassword && "hidden"}`}
                          fontSize={18}
                        />
                        <Icon
                          icon={`mdi:eye-outline`}
                          className={`${!showPassword && "hidden"}`}
                          fontSize={18}
                        />
                      </button>
                    </div>
                  </div>
                  <p hidden={!error} className="text-red-800 text-xs pl-6 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </section>
            <section className="px-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon
                    icon="material-symbols:info-outline-rounded"
                    className="text-orange-600 mt-0.5"
                    fontSize={24}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      {t("info.label")}
                    </h4>
                    <ul className="space-y-1.5 text-sm text-orange-800">
                      <li className="flex items-start gap-2">
                        <Icon
                          icon="uil:unlock"
                          fontSize={18}
                          className="mt-0.5 flex-shrink-0"
                        />
                        <span>{t("info.unlock_payroll")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon
                          icon="tabler:clock"
                          fontSize={18}
                          className="mt-0.5 flex-shrink-0"
                        />
                        <span>{t("info.to_draft")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon
                          icon="line-md:edit"
                          fontSize={18}
                          className="mt-0.5 flex-shrink-0"
                        />
                        <span>{t("info.marked")}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
            <div className="w-full px-6 mb-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-200 text-white w-full h-9 rounded-md text-center"
              >
                {isSubmitting ? (
                  <Icon
                    icon={"mynaui:spinner"}
                    className="animate-spin w-full"
                    fontSize={20}
                  />
                ) : (
                  t("action.unlock")
                )}
              </button>
            </div>
          </form>
        </ModalDialog>
      </Modal>
    </>
  );
}
