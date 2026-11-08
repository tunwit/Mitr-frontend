import { TextInput } from "@/widget/Input";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { useUser } from "@clerk/nextjs";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalClose,
  ModalDialog,
} from "@mui/joy";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { useInvitation } from "@/hooks/hook.invitation";

interface InvitationModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
export default function InvitationModal({
  open,
  setOpen,
}: InvitationModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id: shopId } = useCurrentShop();
  const [invitaionUrl, setInvitationUrl] = useState<string | undefined>("");
  const [isCopied, setIscopied] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState("");
  const canvas = useRef(null);
  const user = useUser();
  const t = useTranslations("owners");
  const invitation = useInvitation();

  const generateHandler = async () => {
    if (!shopId || !user.user) return;
    setIsSubmitting(true);
    setIsGenerated(true);
    setError("");

    try {
      const result = await invitation.create.mutateAsync({
        payload: { email: email },
      });
      if (result.data) {
        const url = result.data?.inviteUrl;
        setInvitationUrl(url);

        QRCode.toCanvas(
          canvas.current,
          url,
          {
            width: 200,
            margin: 2,
          },
          function (error: unknown) {
            if (error) console.error(error);
          },
        );
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsSubmitting(false);
      setIscopied(false);
    }
  };

  const copyHandler = () => {
    if (!invitaionUrl) return;
    setIscopied(true);
    navigator.clipboard.writeText(invitaionUrl);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalDialog sx={{ background: "#fafafa" }}>
        <ModalClose />
        <section className="border-b pb-3 border-gray-400">
          <h1 className="font-bold text-xl">{t("invitation.label")}</h1>
          <p className="opacity-60">{t("invitation.description")}</p>
        </section>

        <section>
          <FormControl>
            <FormLabel>{t("fields.email")}</FormLabel>
            <TextInput
              placeholder="example@gmail.com"
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              endDecorator={
                <Button
                  type="submit"
                  disabled={isSubmitting || email === ""}
                  loading={isSubmitting}
                  onClick={generateHandler}
                  size="sm"
                >
                  {t("actions.generate")}
                </Button>
              }
            />
            {error && <p className="text-red-700">{error}</p>}
          </FormControl>
        </section>
        <section hidden={!invitaionUrl || isSubmitting || !isGenerated}>
          <FormControl>
            <div className="flex items-center justify-center my-5">
              {/* <div hidden={isShortenComplete} className="w-[200px] h-[200px] flex justify-center items-center rounded-md border border-gray-400 text-sm">Cannot generate QR code</div> */}
              <canvas
                ref={canvas}
                className="rounded-md border border-gray-400"
              />
            </div>

            <FormLabel>{t("info.invite_link")}</FormLabel>
            <div className="flex flex-row gap-2">
              <TextInput placeholder="example@gmail.com" value={invitaionUrl} />
              <Button
                sx={{ paddingRight: 2.5 }}
                startDecorator={
                  isCopied ? (
                    <Icon
                      icon={"material-symbols:check-rounded"}
                      fontSize={"15px"}
                    />
                  ) : (
                    <Icon icon={"mynaui:clipboard"} fontSize={"15px"} />
                  )
                }
                onClick={copyHandler}
                size="sm"
              >
                {t("info.copy")}
              </Button>
            </div>
          </FormControl>
        </section>
      </ModalDialog>
    </Modal>
  );
}
