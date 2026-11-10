import { Icon } from "@iconify/react/dist/iconify.js";
import { Dayjs } from "dayjs";
import Checkbox from "@mui/joy/Checkbox";
import { usePathname } from "next/navigation";
import { PAY_PERIOD_STATUS } from "@/types/enum/enum";
import { useCheckBox } from "@/hooks/useCheckBox";
import { Link } from "@/i18n/navigation";

interface PendingElementProps {
  id: number;
  title: string;
  people: number;
  amount: number;
  modifyAt: Dayjs;
  status: PAY_PERIOD_STATUS;
}

interface PayrollStatusType {
  icon: string;
  text: string;
  bg: string;
  textColor: string;
}

const PayrollStatus: { 
  [key in PAY_PERIOD_STATUS]: { icon: string; text: string; bg: string; textColor: string } 
} = {
  [PAY_PERIOD_STATUS.DRAFT]: {
    icon: "tabler:clock",
    text: "Draft",
    bg: "bg-gray-200",
    textColor: "text-gray-950",
  },
  [PAY_PERIOD_STATUS.FINALIZED]: {
    icon: "mdi:check-bold",
    text: "Finalized",
    bg: "bg-amber-200",
    textColor: "text-amber-950",
  },
};

export default function PendingElement({
  id,
  title,
  people,
  modifyAt,
  amount,
  status,
}: PendingElementProps) {
    const {checked, toggle,isChecked} = useCheckBox("payrollPeriods")
  const statusInfo = PayrollStatus[status] || {};
  const moneyFormat = new Intl.NumberFormat("th-TH").format(amount || 0);
  const pathname = usePathname();

  return (
    <>
      <div className="flex flex-row gap-5 items-center w-full bg-[#f4f6f8] min-h-16 rounded-sm border border-[#d4d4d4] pl-5 pr-10 opacity-80 shadow-sm">
        <Checkbox
          checked={isChecked(id)}
          onChange={()=>toggle(id)}
        />
        <div className="flex flex-row w-full font-light justify-between items-center ">
          <div className="flex flex-col min-w-[200px] ">
            <p className="font-bold">{title}</p>
            <div className="flex flex-row items-center text-xs gap-1 opacity-55">
              <Icon icon="solar:user-bold" />
              <p>{people} people</p>
            </div>
          </div>

          <p className="min-w-[150px]">
            {modifyAt?.format("DD MMM YYYY, HH:mm")}
          </p>

          <p className="min-w-[100px]">{moneyFormat} ฿</p>

          <div
            className={`flex flex-row justify-center items-center gap-1 px-2 py-[1px] rounded-2xl w-fit ${statusInfo.bg}`}
          >
            <Icon className={statusInfo.textColor} icon={statusInfo.icon} />
            <p className={`text-sm font-semibold ${statusInfo.textColor}`}>
              {statusInfo.text}
            </p>
          </div>

          <Link
            className="text-blue-700 underline"
            href={`${pathname}/edit?id=${id}`}
          >
            Edit
          </Link>
        </div>
      </div>
    </>
  );
}
