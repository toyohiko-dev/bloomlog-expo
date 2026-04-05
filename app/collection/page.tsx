import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { listCollectionActivityLogs } from "@/lib/sessions";
import { getActivityPhotoUrl } from "@/lib/supabase/shared";
import { CollectionFilters } from "./collection-filters";

export default async function CollectionPage() {
  const logs = await listCollectionActivityLogs();
  const logsWithPhotoUrl = logs.map((log) => ({
    ...log,
    photoUrl: log.photo_path ? getActivityPhotoUrl(log.photo_path) : null,
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AppPrimaryNav currentPath="/collection" />

        <CollectionFilters logs={logsWithPhotoUrl} />
      </div>
    </main>
  );
}
