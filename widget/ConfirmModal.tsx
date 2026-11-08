import { Icon } from "@iconify/react/dist/iconify.js"
import { Button, Modal, ModalClose, ModalDialog } from "@mui/joy"
import { useTranslations } from "next-intl"
import { Dispatch, SetStateAction } from "react"

interface ConfirmModalProps{
    title:string
    description:string
    open: boolean
    setOpen:Dispatch<SetStateAction<boolean>>
    isPending?: boolean
    onConfirm?: () => void | boolean | Promise<void | boolean>
    onCancel?: () => void | Promise<void>
}


export default function ConfirmModal({title,description,open,setOpen,onCancel,onConfirm,isPending = false}:ConfirmModalProps) {
    const t = useTranslations("confirm_modal")
    const handleCancel = async () => {
        if (isPending) return
        if (onCancel) await onCancel()
        setOpen(false)
    }

    const handleConfirm = async () => {
        if (isPending) return
        if (onConfirm && await onConfirm() === false) return
        setOpen(false)
    }
   return (
   <Modal  open={open} onClose={()=>{ if (!isPending) setOpen(false) }} >
        <ModalDialog sx={{width: { xs: "calc(100% - 24px)", sm: 480 }, maxWidth: "100%", background: "#fafafa" }}>
            <ModalClose disabled={isPending}/>
            <section className="flex flex-col items-center">
                <div className="bg-red-200 w-fit p-4 rounded-full">
                    <Icon className="text-red-600" icon="jam:triangle-danger" fontSize={"40px"}/>
                </div>
                <h1 className="text-2xl font-semibold mt-4">{title}</h1>
                <p className="text-lg mt-2 opacity-50 text-center px-3">{description}</p>
            </section>
            <section className="flex gap-3 w-full justify-center mt-2">
                <Button sx={{width:"100%"}} disabled={isPending} variant="outlined" color="neutral" onClick={handleCancel}>{t("actions.cancel")}</Button>
                <Button sx={{width:"100%"}} disabled={isPending} loading={isPending} color="danger" onClick={handleConfirm}>{t("actions.confirm")}</Button>
            </section>
        </ModalDialog>
    </Modal>)

}
