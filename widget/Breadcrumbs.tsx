"use client";

import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  items: readonly { label: ReactNode; href?: string }[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const t = useTranslations("common");

  return (
    <nav
      aria-label={t("breadcrumbs")}
      className={cn("text-[#424242] text-xs", className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <Fragment key={index}>
              {index > 0 && <li aria-hidden="true">{">"}</li>}
              <li
                className={current ? "text-blue-800" : undefined}
                aria-current={current ? "page" : undefined}
              >
                {item.href && !current ? (
                  <Link href={item.href} className="hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
