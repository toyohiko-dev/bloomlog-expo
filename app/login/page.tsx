import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { getCurrentUser, getSafeRedirectPath } from "@/lib/auth";
import { getCurrentProfile } from "@/lib/profiles";

type LoginPageProps = {
  searchParams?:
    | Promise<{ next?: string | string[] | undefined; error?: string | string[] | undefined }>
    | { next?: string | string[] | undefined; error?: string | string[] | undefined };
};

function readQueryValue(value?: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getCurrentProfile();
    redirect(profile ? "/" : "/profile/setup");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = getSafeRedirectPath(readQueryValue(resolvedSearchParams?.next));
  const hasOAuthError = readQueryValue(resolvedSearchParams?.error) === "oauth";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
        <section className="w-full rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-medium text-emerald-700">BloomLog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            ログイン
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            BloomLog は来場体験を振り返るためのアプリです。ログインすると、Visit Day と
            Activity があなたのアカウントに紐づきます。
          </p>

          {hasOAuthError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              認証を完了できませんでした。時間を置いてもう一度試してください。
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
