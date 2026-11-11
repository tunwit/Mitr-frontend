"use client";
import Breadcrumbs from "@/widget/Breadcrumbs";
import { useTranslations } from "next-intl";
import { useSession, useSignIn } from "@clerk/nextjs";
import { Button, FormControl } from "@mui/joy";
import { useEffect, useState } from "react";
import { showError } from "@/utils/showSnackbar";
import { Link, useRouter } from "@/i18n/navigation";
import { useInvitation } from "@/hooks/hook.invitation";
import { useOwnShop } from "@/hooks/hook.shop";
import { useSearchParams } from "next/navigation";

export default function InvitaionPage() {
  const tb = useTranslations("breadcrumb");
  const params = useSearchParams();
  const token = params.get("token");
  const method = params.get("method");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyOwner, setAlreadyOwner] = useState(false);
  const [wrongEmail, setWrongEmail] = useState(false);
  const { signIn } = useSignIn();
  const inviteHook = useInvitation();

  const { data: invitation, isLoading: loadinginvitation } =
    inviteHook.useGetByToken(token);

  const { mutateAsync: acceptAsync } = inviteHook.useAccept(token);

  const { data: ownShops, isLoading: loadingshops } = useOwnShop();

  const { session, isSignedIn, isLoaded: sessionLoaded } = useSession();
  const router = useRouter();

  const acceptHandler = async (
    e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    e?.preventDefault();
    setIsSubmitting(true);
    if (!token) {
      setIsSubmitting(false);
      return;
    }

    if (isSignedIn) {
      try {
        await acceptAsync();
        router.push("/");
      } catch {
        showError("Cannot accept invitation");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await signIn?.sso({
        strategy: "oauth_google",
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: `${window.location.origin}/accept-invitation?token=${token}&method=auto`,
      });
    }
  };

  useEffect(() => {
    if (isSignedIn && invitation?.data && ownShops?.data) {
      const emailMatch =
        session.user.primaryEmailAddress?.emailAddress.toLowerCase() ===
        invitation.data.email.toLowerCase();

      const alreadyOwn = ownShops.data.some(
        (s) => s.id === invitation?.data?.shop.id,
      );
      setAlreadyOwner(alreadyOwn);

      if (!emailMatch) {
        setWrongEmail(true);
      } else if (method === "auto") {
        acceptHandler();
      }
    }
  }, [isSignedIn, session, invitation, ownShops, method]);

  const loading = loadinginvitation || !sessionLoaded || loadingshops;

  if (!token)
    return (
      <div className="page-gutter w-full space-y-5 py-10">
        <Breadcrumbs items={[{ label: tb("accept_invitation") }]} />
        <p>Invalid token</p>
      </div>
    );

  if (loading) {
    return (
      <div className="page-gutter flex min-h-screen w-full flex-col items-center gap-5 py-10">
        <Breadcrumbs className="w-full" items={[{ label: tb("accept_invitation") }]} />
        <p className="my-auto">Loading invitation...</p>
      </div>
    );
  }
  let content;
  if (!invitation?.data) {
    content = (
      <div className="flex flex-col gap-3 items-center justify-center text-2xl font-bold text-gray-900 mb-2">
        <p className="text-2xl font-bold text-gray-900">Invitation not found</p>
        <p className="text-gray-500">Please contact supervisor</p>
      </div>
    );
  } else if (new Date(invitation?.data?.expiresAt) < new Date()) {
    content = (
      <div className="flex flex-col gap-3 items-center justify-center mb-2">
        <p className="text-2xl font-bold text-gray-900">Invitation Expired</p>
        <p className="text-gray-500">Please contact supervisor</p>
      </div>
    );
  } else if (wrongEmail) {
    content = (
      <div className="flex flex-col gap-3 items-center justify-center mb-2">
        <p className="text-2xl font-bold text-gray-900">
          This invitation is ment for
        </p>
        <p className="text-gray-500">{invitation?.data?.email}</p>
      </div>
    );
  } else if (alreadyOwner) {
    content = (
      <div className="flex flex-col gap-3 items-center justify-center mb-2">
        <p className="text-2xl font-bold text-gray-900">
          You already own this shop
        </p>
      </div>
    );
  } else {
    content = (
      <>
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You have been invited to shop
          </h1>

          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            {invitation.data.shop.name}
          </h2>
        </div>

        <div className="flex justify-center mb-6">
          <form className="flex flex-col gap-4">
            <FormControl>
              <Button
                disabled={isSubmitting}
                loading={isSubmitting}
                type="submit"
                onClick={(e) => acceptHandler(e)}
              >
                {isSubmitting ? "Registering" : "Accept Invitation"}
              </Button>
            </FormControl>
          </form>
        </div>
      </>
    );
  }

  return (
    <div className="page-gutter flex min-h-screen w-full flex-col items-center gap-5 bg-gray-50 py-10">
      <Breadcrumbs className="w-full" items={[{ label: tb("accept_invitation") }]} />
      <div className="my-auto max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
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
        {content}
        <div id="clerk-captcha" />
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Need help?{" "}
            <Link
              locale="th"
              href="/support"
              className="text-blue-600 hover:underline"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
