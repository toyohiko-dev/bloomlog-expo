import Link from "next/link";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { PavilionAlbum } from "./pavilion-album";
import {
  buildAreaGroupedPavilionTreemapData,
  buildPavilionCollection,
  listAreas,
  listCollectionActivityLogs,
} from "@/lib/sessions";

export default async function CollectionNextPage() {
  const [logs, areas] = await Promise.all([
    listCollectionActivityLogs(),
    listAreas(),
  ]);
  console.log("[areas]", areas);
  console.log("[collection-next] page data sizes", {
    logsLength: logs.length,
    areasLength: areas.length,
  });
  const pavilionItems = buildPavilionCollection(logs);
  const groupedItems = buildAreaGroupedPavilionTreemapData(pavilionItems, areas);
  const areaCountItems = groupedItems.map((group) => ({
    areaId: group.areaId,
    name: group.name,
    value: group.children.reduce((total, child) => total + child.count, 0),
  }))
    .sort((left, right) => {
      if (left.value !== right.value) {
        return right.value - left.value;
      }

      return left.name.localeCompare(right.name, "ja-JP");
    });
  const topArea = areaCountItems[0] ?? null;
  const areaNameById = new Map(
    groupedItems.map((group) => [group.areaId, group.name] as const),
  );
  const topPavilion = pavilionItems[0]
    ? {
        name: pavilionItems[0].title,
        count: pavilionItems[0].count,
        areaName: pavilionItems[0].areaId
          ? areaNameById.get(pavilionItems[0].areaId) ?? null
          : null,
      }
    : null;

  console.log("[collection-next] grouped treemap data", groupedItems);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eefbf5_46%,#f8fafc_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AppPrimaryNav currentPath="/collection" />

        <section className="overflow-hidden bg-white/95 shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 via-white to-sky-50/70 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-emerald-700">
                  Collection Next
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  パビリオン専用の思い出アルバム
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  よく訪れたパビリオンが大きく育つ、眺めるための検証UIです。
                </p>
              </div>

              <Link
                href="/collection"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                既存の /collection を見る
              </Link>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <PavilionAlbum
              items={groupedItems}
              summary={{
                topArea,
                topPavilion,
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
