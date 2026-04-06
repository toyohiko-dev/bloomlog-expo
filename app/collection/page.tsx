import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { listCollectionActivityLogs } from "@/lib/sessions";
import { getActivityPhotoUrl, getPavilionImageUrl } from "@/lib/supabase/shared";
import { CollectionFilters } from "./collection-filters";

export default async function CollectionPage() {
  const logs = await listCollectionActivityLogs();
  const albumLogs = logs.map((log) => ({
    ...log,
    thumbnailUrl: log.photo_path ? getActivityPhotoUrl(log.photo_path) : null,
    pavilionThumbnailUrl: log.pavilion?.image_path
      ? getPavilionImageUrl(log.pavilion.image_path)
      : null,
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[68rem] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AppPrimaryNav currentPath="/collection" />

        <CollectionFilters logs={albumLogs} />
      </div>
    </main>
  );
}
