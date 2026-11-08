import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React from "react";

interface DashboardButtonProps {
  title: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  selected?: boolean;
  id: string;
  href: string;
  items?: {
    titleKey: string;
    id: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    onclick?: () => void | Promise<void>;
    href?: string;
    selected?: boolean;
  }[];
}

export default function DashboardButton({
  title,
  icon,
  selected = false,
  items,
  href,
}: DashboardButtonProps) {
  const IconComponent = icon;
  const t = useTranslations();
  return (
    <>
      <Link
        href={href}
        aria-current={
          selected && !items?.some((item) => item.selected) ? "page" : undefined
        }
      >
        <div
          className={`flex flex-row rounded-sm font-semibold gap-3 mr-3  py-2 px-[5%] items-center hover:bg-[#2b2b2b] ${selected ? "bg-[#d9a241] rounded-sm hover:bg-[#d9a241] " : ""}`}
        >
          <IconComponent
            className={`text-[#7a7a7a] text-lg ${selected ? "text-[#363636]" : ""}`}
          />
          <p className={`text-[#7a7a7a] ${selected ? "text-[#363636]" : ""}`}>
            {title}
          </p>
        </div>
      </Link>
      {items && (
        <ul className="px-12 text-[#7a7a7a] flex flex-col gap-2 list-disc">
          {items.map((i) => {
            return (
              <li
                className={`list-disc font-bold ${i.selected ? "text-[#d9a241]" : ""}`}
                key={i.id}
              >
                {i.href ? (
                  <Link
                    href={i.href}
                    aria-current={i.selected ? "page" : undefined}
                    className="block rounded-sm py-1 hover:text-[#dedede] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9a241]"
                  >
                    {t(i.titleKey)}
                  </Link>
                ) : (
                  <button onClick={i.onclick}>{t(i.titleKey)}</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
