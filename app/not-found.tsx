
import Breadcrumbs from "@/widget/Breadcrumbs";
import { NextIntlClientProvider } from "next-intl";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

export default async function NotFound() {
  const t = await getTranslations("not_found");

  return (
    <main className="page-gutter flex min-h-screen w-full flex-col items-center gap-5 bg-gray-100 py-10">
      <title>{t("label")}</title>
      <NextIntlClientProvider>
        <Breadcrumbs className="w-full" items={[{ label: t("label") }]} />
      </NextIntlClientProvider>
      <div className="my-auto bg-white px-10 w-[50%] h-[50%] rounded-2xl flex items-center">
        <Image alt="not-found" src="/not-found.png" height={500} width={500} />
        <div>
          <p className="font-bold text-5xl">{t("label")} !</p>
          <p className="text-xl mt-3">{t("description")}</p>
          <p className="text-gray-400 mt-2">{t("disclaimer")}</p>
          <Link
            href="/"
            className="w-fit flex items-center  gap-3 bg-black text-white py-2 px-4 mt-3 rounded-full"
          >
            <Icon icon="quill:link-out" fontSize={20} />
            {t("actions.back")}
          </Link>
        </div>
      </div>
    </main>
  );
}
