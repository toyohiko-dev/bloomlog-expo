import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentProfile, hasCompletedProfile } from "@/lib/profiles";
import { getSafeRedirectPath } from "@/lib/redirect";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[] | undefined;
    error?: string | string[] | undefined;
  }>;
};

function readQueryValue(value?: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getLoginErrorMessage(errorCode?: string) {
  switch (errorCode) {
    case "callback_failed":
      return "ログインできませんでした。もう一度「Googleでログイン」を押してください。";
    case "google_not_enabled":
      return "現在、Googleでログインできません。しばらくしてからお試しください。";
    case "unexpected":
      return "うまく読み込めませんでした。少し待ってから、もう一度お試しください。";
    default:
      return null;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getCurrentProfile();
    redirect(hasCompletedProfile(profile) ? "/" : "/profile/setup");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = getSafeRedirectPath(readQueryValue(resolvedSearchParams?.next));
  const errorMessage = getLoginErrorMessage(readQueryValue(resolvedSearchParams?.error));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
        <section className="w-full rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-medium text-emerald-700">BloomLog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Googleでログイン
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            BloomLogは、会場での写真や出来事を残し、地図やアルバムで見返すアプリです。
          </p>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-8">
            <LoginForm nextPath={nextPath} />
          </div>
        </section>
      </div>
    </main>
  );
}
