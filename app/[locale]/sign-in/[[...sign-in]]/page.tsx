"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import LanguageSelector from "@/widget/LangaugeSelector";
import { useSignIn } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function SignInPage() {
  const { signIn } = useSignIn();
  const t = useTranslations("sign-in");
  const tb = useTranslations("breadcrumb");
  const handleGoogleSignIn = () => {
    if (!signIn) return;
    return signIn
      .sso({
        strategy: "oauth_google",
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/",
      })
      .catch((err: any) => {
        console.log(err.errors);
        console.error(err, null, 2);
      });
  };

  return (
    <div className="min-h-screen bg-linear-to-br w-full from-gray-50 to-gray-100 flex flex-col items-center gap-5 page-gutter py-10">
      <Breadcrumbs className="w-full" items={[{ label: tb("sign_in") }]} />
      <div className="absolute top-5 right-5">
        <LanguageSelector theme="white"/>
      </div>
      <div className="my-auto w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex w-full items-center justify-center x">
            <Image alt="logo" src="/logo-text.png" height={200} width={200} loading="eager"/>
          </div>
          <p className="text-gray-600 text-lg font-medium mt-3">{t("label")}</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {t("welcome")}
          </h2>
          <p className="text-gray-500 mb-8">{t("signin_to_continue")}</p>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-gray-300"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{t("actions.google")}</span>
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400 font-medium">
                {t("info.secure")}
              </span>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-center text-sm text-gray-400">
            By signing in, you agree to our{" "}
            <a
              href="#"
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Privacy Policy
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-xs">
          V 1.3.0 @beta
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div
        className="fixed bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
    </div>
  );
}
