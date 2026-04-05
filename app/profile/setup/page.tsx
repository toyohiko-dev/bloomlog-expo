import { redirect } from "next/navigation";
import { ProfileForm } from "@/app/profile/profile-form";
import { getSafeRedirectPath, requireUser } from "@/lib/auth";
import { getCurrentProfile } from "@/lib/profiles";

type ProfileSetupPageProps = {
  searchParams?:
    | Promise<{ next?: string | string[] | undefined }>
    | { next?: string | string[] | undefined };
};

function readQueryValue(value?: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfileSetupPage({
  searchParams,
}: ProfileSetupPageProps) {
  await requireUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = getSafeRedirectPath(readQueryValue(resolvedSearchParams?.next));
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
        <section className="w-full rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-medium text-emerald-700">BloomLog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            ニックネームを設定
          </h1>
          <div className="mt-8">
            <ProfileForm
              initialDisplayName=""
              submitLabel="設定する"
              nextPath={nextPath}
              mode="setup"
              description="初回ログインありがとうございます。まずは表示用のニックネームを設定しましょう。"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
