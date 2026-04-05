import Link from "next/link";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { ProfileForm } from "@/app/profile/profile-form";
import { getCurrentProfile } from "@/lib/profiles";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <AppPrimaryNav currentPath="/" />

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-700">プロフィール</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              表示名の設定
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              BloomLog で表示する名前を設定できます。ログインIDではなく、表示用の名前です。
            </p>
          </div>

          <div className="mt-8">
            <ProfileForm
              initialDisplayName={profile?.display_name ?? ""}
              submitLabel="保存する"
            />
          </div>

          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              ホームへ戻る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
