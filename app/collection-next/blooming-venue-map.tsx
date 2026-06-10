import type { PavilionCollectionItem } from "@/lib/sessions";
import type { Area, PavilionOption } from "@/lib/session-shared";
import { getPavilionImageUrl } from "@/lib/supabase/shared";
import {
  getVenueAreaPlacement,
  getVenuePavilionPlacement,
  VENUE_MAP_ASSET,
  VENUE_MAP_CANVAS,
  type VenueAreaPlacement,
} from "./venue-map-config";
import { VenueMapFrame } from "./venue-map-frame";

type BloomingVenueMapProps = {
  areas: Area[];
  pavilions: PavilionOption[];
  visitedItems: PavilionCollectionItem[];
};

type PavilionMapPoint = {
  id: string;
  name: string;
  areaId: string;
  x: number;
  y: number;
  visited: boolean;
  areaName: string;
  placementKey: string;
  bloom: string;
  imageUrl: string | null;
  size: number;
  rotation: number;
  visitCount: number;
  firstVisitedAt: string | null;
  latestVisitedAt: string | null;
  latestSessionId: string | null;
};

type VenueAreaProgress = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bloom: string;
  visitedCount: number;
  totalCount: number;
  progress: number;
};

function getAreaNameById(areas: Area[]) {
  return new Map(areas.map((area) => [area.id, area.name] as const));
}

function buildVisitedPavilionIds(items: PavilionCollectionItem[]) {
  return new Set(
    items
      .map((item) => item.pavilionId)
      .filter((id): id is string => Boolean(id)),
  );
}

function buildVisitedPavilionItemById(items: PavilionCollectionItem[]) {
  return new Map(
    items
      .filter((item): item is PavilionCollectionItem & { pavilionId: string } =>
        Boolean(item.pavilionId)
      )
      .map((item) => [item.pavilionId, item] as const),
  );
}

function groupPavilionsByArea(pavilions: PavilionOption[], areas: Area[]) {
  const areaIds = new Set(areas.map((area) => area.id));
  const grouped = new Map<string, PavilionOption[]>();
  const seenPavilionIds = new Set<string>();

  for (const area of areas) {
    grouped.set(area.id, []);
  }

  if (!grouped.has("unassigned")) {
    grouped.set("unassigned", []);
  }

  for (const pavilion of pavilions) {
    if (seenPavilionIds.has(pavilion.id)) {
      continue;
    }

    seenPavilionIds.add(pavilion.id);

    const areaId = pavilion.area_id && areaIds.has(pavilion.area_id)
      ? pavilion.area_id
      : "unassigned";
    grouped.get(areaId)?.push(pavilion);
  }

  for (const entries of grouped.values()) {
    entries.sort((left, right) => {
      if (left.sort_order !== right.sort_order) {
        return left.sort_order - right.sort_order;
      }

      return left.name.localeCompare(right.name, "ja-JP");
    });
  }

  return grouped;
}

function getGridPoint(
  placement: VenueAreaPlacement,
  index: number,
  total: number,
) {
  const box = placement.pointBox;
  const columns = Math.max(2, Math.ceil(Math.sqrt(total)));
  const rows = Math.max(1, Math.ceil(total / columns));
  const column = index % columns;
  const row = Math.floor(index / columns);
  const xStep = box.width / (columns + 1);
  const yStep = box.height / (rows + 1);
  const stagger = row % 2 === 1 ? xStep * 0.32 : 0;
  const jitterX = ((index * 37) % 7 - 3) * 0.42;
  const jitterY = ((index * 29) % 5 - 2) * 0.34;

  return {
    x: box.x + xStep * (column + 1) + stagger + jitterX,
    y: box.y + yStep * (row + 1) + jitterY,
  };
}

function buildPavilionPoints({
  areas,
  pavilions,
  visitedIds,
  visitedItemById,
}: {
  areas: Area[];
  pavilions: PavilionOption[];
  visitedIds: Set<string>;
  visitedItemById: Map<string, PavilionCollectionItem>;
}) {
  const areaNameById = getAreaNameById(areas);
  const grouped = groupPavilionsByArea(pavilions, areas);
  const orderedAreaIds = Array.from(new Set([
    ...areas.map((area) => area.id),
    grouped.get("unassigned")?.length ? "unassigned" : null,
  ].filter((areaId): areaId is string => Boolean(areaId))));

  return orderedAreaIds.flatMap((areaId, areaIndex) => {
    const areaPavilions = grouped.get(areaId) ?? [];
    const areaName = areaNameById.get(areaId) ?? "未分類";
    const placement = getVenueAreaPlacement(areaName, areaIndex);

    return areaPavilions.map((pavilion, pavilionIndex) => {
      const fixedPoint = getVenuePavilionPlacement({
        pavilionId: pavilion.id,
        name: pavilion.name,
      });
      const point = fixedPoint
        ?? getGridPoint(placement, pavilionIndex, areaPavilions.length);
      const visitedItem = visitedItemById.get(pavilion.id);

      return {
        id: pavilion.id,
        name: pavilion.name,
        areaId,
        x: point.x,
        y: point.y,
        visited: visitedIds.has(pavilion.id),
        areaName,
        placementKey: placement.key,
        bloom: placement.bloom,
        imageUrl: pavilion.image_path
          ? getPavilionImageUrl(pavilion.image_path)
          : null,
        size: fixedPoint?.size ?? 1,
        rotation: fixedPoint?.rotation ?? ((pavilionIndex * 47) % 34) - 17,
        visitCount: visitedItem?.count ?? 0,
        firstVisitedAt: visitedItem?.firstVisitedAt ?? null,
        latestVisitedAt: visitedItem?.latestVisitedAt ?? null,
        latestSessionId: visitedItem?.latestSessionId ?? null,
      } satisfies PavilionMapPoint;
    });
  });
}

function buildVenueAreaProgress({
  areas,
  pavilions,
  visitedIds,
}: {
  areas: Area[];
  pavilions: PavilionOption[];
  visitedIds: Set<string>;
}) {
  const areaNameById = getAreaNameById(areas);
  const grouped = groupPavilionsByArea(pavilions, areas);
  const orderedAreaIds = Array.from(new Set([
    ...areas.map((area) => area.id),
    grouped.get("unassigned")?.length ? "unassigned" : null,
  ].filter((areaId): areaId is string => Boolean(areaId))));

  return orderedAreaIds.flatMap((areaId, areaIndex) => {
    const areaPavilions = grouped.get(areaId) ?? [];
    const totalCount = areaPavilions.length;

    if (totalCount === 0) {
      return [];
    }

    const visitedCount = areaPavilions.filter((pavilion) =>
      visitedIds.has(pavilion.id)
    ).length;
    const areaName = areaNameById.get(areaId) ?? "未分類";
    const placement = getVenueAreaPlacement(areaName, areaIndex);

    return [{
      id: areaId,
      name: areaName,
      x: placement.areaBox.x,
      y: placement.areaBox.y,
      width: placement.areaBox.width,
      height: placement.areaBox.height,
      bloom: placement.bloom,
      visitedCount,
      totalCount,
      progress: visitedCount / totalCount,
    } satisfies VenueAreaProgress];
  });
}

function AreaProgressLayer({ area }: { area: VenueAreaProgress }) {
  if (area.progress <= 0) {
    return null;
  }

  const isCompleted = area.progress >= 1;
  const washOpacity = isCompleted ? 0.2 : 0.06 + area.progress * 0.1;
  const strokeOpacity = isCompleted ? 0.3 : 0.12 + area.progress * 0.12;
  const patternId = `venue-area-flower-field-${area.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <g className="venue-map-area-progress">
      {isCompleted ? (
        <defs>
          <pattern
            id={patternId}
            width="4.8"
            height="4.8"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.4" cy="1.6" r="0.45" fill={area.bloom} opacity="0.52" />
            <circle cx="2.2" cy="1.6" r="0.45" fill="#fbbf24" opacity="0.46" />
            <circle cx="1.8" cy="2.3" r="0.45" fill="#fb7185" opacity="0.42" />
          </pattern>
        </defs>
      ) : null}
      <rect
        x={area.x}
        y={area.y}
        width={area.width}
        height={area.height}
        rx="5"
        fill={area.bloom}
        opacity={washOpacity}
      />
      {isCompleted ? (
        <rect
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
          rx="5"
          fill={`url(#${patternId})`}
          opacity="0.72"
        />
      ) : null}
      <rect
        x={area.x + 0.8}
        y={area.y + 0.8}
        width={Math.max(area.width - 1.6, 0)}
        height={Math.max(area.height - 1.6, 0)}
        rx="4.2"
        fill="none"
        stroke={area.bloom}
        strokeWidth="0.5"
        opacity={strokeOpacity}
      />
      <title>{`${area.name}・${area.visitedCount}/${area.totalCount} 訪問済み`}</title>
    </g>
  );
}

export function BloomingVenueMap({
  areas,
  pavilions,
  visitedItems,
}: BloomingVenueMapProps) {
  const knownAreaIds = new Set(areas.map((area) => area.id));
  const hasUnassignedPavilions = pavilions.some(
    (pavilion) => !pavilion.area_id || !knownAreaIds.has(pavilion.area_id),
  );
  const mapAreas = hasUnassignedPavilions
    ? [
        ...areas,
        {
          id: "unassigned",
          name: "未分類",
          sort_order: null,
        } satisfies Area,
      ]
    : areas;
  const visitedIds = buildVisitedPavilionIds(visitedItems);
  const visitedItemById = buildVisitedPavilionItemById(visitedItems);
  const points = buildPavilionPoints({
    areas: mapAreas,
    pavilions,
    visitedIds,
    visitedItemById,
  });
  const areaProgress = buildVenueAreaProgress({
    areas: mapAreas,
    pavilions,
    visitedIds,
  });
  const visitedCount = points.filter((point) => point.visited).length;
  const unvisitedCount = Math.max(points.length - visitedCount, 0);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#fbfffc_0%,#f8fbff_48%,#fffaf2_100%)] ring-1 ring-emerald-100">
      <style>
        {`
          .venue-map-area-progress {
            transform-box: fill-box;
            transform-origin: center;
            animation: venue-map-village-wash 620ms ease-out both;
          }

          @keyframes venue-map-village-wash {
            0% { opacity: 0; scale: .96; }
            100% { opacity: 1; scale: 1; }
          }

          .venue-map-marker-layer {
            inset: 0;
            overflow: hidden;
            pointer-events: none;
            position: absolute;
            z-index: 10;
          }

          .venue-map-marker {
            position: absolute;
            transform-origin: center;
            will-change: left, top;
          }

          .venue-map-marker-button {
            appearance: none;
            border: 0;
            color: inherit;
            cursor: pointer;
            padding: 0;
            pointer-events: auto;
          }

          .venue-map-marker-unvisited {
            background: #fff;
            border: 1.5px solid #bfd2cc;
            border-radius: 999px;
            height: 12px;
            width: 12px;
          }

          .venue-map-marker-unvisited:hover,
          .venue-map-marker-unvisited:focus-visible {
            border-color: #059669;
            box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.12);
            outline: none;
          }

          .venue-map-marker-visited {
            animation: venue-map-bloom-open 360ms ease-out both;
            background: transparent;
            height: 68px;
            width: 68px;
          }

          .venue-map-marker-visited:focus-visible {
            outline: none;
          }

          .venue-map-marker-visited:hover .venue-map-bloom-core,
          .venue-map-marker-visited:focus-visible .venue-map-bloom-core {
            box-shadow:
              0 0 0 3px rgba(255, 255, 255, 0.9),
              0 0 0 6px color-mix(in srgb, var(--marker-bloom) 34%, transparent),
              0 10px 18px rgba(78, 68, 47, 0.2);
          }

          .venue-map-bloom-petal {
            background:
              radial-gradient(ellipse at 34% 24%, rgba(255, 255, 255, 0.88), transparent 38%),
              linear-gradient(160deg, color-mix(in srgb, var(--marker-bloom) 62%, #ffffff) 0%, var(--marker-bloom) 76%),
              var(--marker-bloom);
            border: 1.5px solid rgba(255, 255, 255, 0.82);
            border-radius: 999px 999px 720px 720px;
            box-shadow: 0 6px 12px color-mix(in srgb, var(--marker-bloom) 22%, transparent);
            height: 30px;
            left: 23px;
            position: absolute;
            top: 0;
            transform-origin: 11px 34px;
            width: 22px;
            z-index: 0;
          }

          .venue-map-bloom-petal-1 {
            transform: rotate(0deg);
          }

          .venue-map-bloom-petal-2 {
            transform: rotate(45deg);
          }

          .venue-map-bloom-petal-3 {
            transform: rotate(90deg);
          }

          .venue-map-bloom-petal-4 {
            transform: rotate(135deg);
          }

          .venue-map-bloom-petal-5 {
            transform: rotate(180deg);
          }

          .venue-map-bloom-petal-6 {
            transform: rotate(225deg);
          }

          .venue-map-bloom-petal-7 {
            transform: rotate(270deg);
          }

          .venue-map-bloom-petal-8 {
            transform: rotate(315deg);
          }

          .venue-map-bloom-core {
            background-color: #fff7d6;
            background-position: center;
            background-size: cover;
            border: 1px solid rgba(120, 93, 34, 0.18);
            border-radius: 999px;
            box-shadow:
              0 0 0 3px rgba(255, 255, 255, 0.86),
              0 0 0 5px color-mix(in srgb, var(--marker-bloom) 20%, transparent),
              0 7px 14px rgba(78, 68, 47, 0.16);
            height: 34px;
            left: 17px;
            position: absolute;
            top: 17px;
            width: 34px;
            z-index: 1;
          }

          @keyframes venue-map-bloom-open {
            from {
              opacity: 0.75;
              transform: translate(-50%, -50%) scale(0.72);
            }

            to {
              opacity: 1;
            }
          }

        `}
      </style>

      <div className="pointer-events-none absolute left-5 top-5 z-10 sm:left-8 sm:top-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700/80">
          制覇マップ
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950/90 sm:text-3xl">
          訪問の記録
        </h2>
        <p className="mt-2 inline-flex bg-white/75 px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80 backdrop-blur sm:hidden">
          {visitedCount} / {points.length} 訪問済み
        </p>
      </div>

      <VenueMapFrame markers={points}>
        <svg
          aria-label="訪問済みと未訪問のパビリオンを示す白地図ベースの制覇マップ"
          className={[
            "relative z-0 h-auto w-full max-w-none",
            VENUE_MAP_CANVAS.aspectRatio,
          ].join(" ")}
          viewBox={VENUE_MAP_ASSET.viewBox}
          role="img"
        >
          <image
            href={VENUE_MAP_ASSET.href}
            x="0"
            y="0"
            width={VENUE_MAP_ASSET.width}
            height={VENUE_MAP_ASSET.height}
            preserveAspectRatio="xMidYMid meet"
          />

          {areaProgress.map((area) => (
            <AreaProgressLayer key={area.id} area={area} />
          ))}
        </svg>
      </VenueMapFrame>

      <div className="pointer-events-none absolute bottom-5 left-5 z-10 hidden items-end gap-5 sm:bottom-8 sm:left-8 sm:flex">
        <div>
          <p className="text-4xl font-semibold tracking-tight text-slate-950/90 sm:text-5xl">
            {visitedCount} / {points.length}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">訪問済み</p>
        </div>
        <p className="pb-2 text-xs font-medium text-slate-500 sm:text-sm">
          未訪問 {unvisitedCount}
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-5 right-5 z-10 hidden items-center gap-3 text-[11px] font-medium text-slate-500 sm:bottom-8 sm:right-8 sm:flex">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          訪問済み
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
          未訪問
        </span>
      </div>
    </section>
  );
}
