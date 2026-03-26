import Link from "next/link";
import { listCollectionActivityLogs } from "@/lib/sessions";
import { CollectionFilters } from "./collection-filters";

export default async function CollectionPage() {
  const logs = await listCollectionActivityLogs();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            ホームへ
          </Link>
          <Link
            href="/sessions"
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            訪問一覧へ
          </Link>
        </div>

        <CollectionFilters logs={logs} />
      </div>
    </main>
  );
}
