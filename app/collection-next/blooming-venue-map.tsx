import type { PavilionCollectionItem } from "@/lib/sessions";
import type { Area, PavilionOption } from "@/lib/session-shared";
import { getPavilionImageUrl } from "@/lib/supabase/shared";

type BloomingVenueMapProps = {
  areas: Area[];
  pavilions: PavilionOption[];
  visitedItems: PavilionCollectionItem[];
};

type VenueAreaLayout = {
  pointBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  bloom: string;
};

type PavilionMapPoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  visited: boolean;
  areaName: string;
  bloom: string;
  imageUrl: string | null;
  size: number;
  rotation: number;
};

const AREA_LAYOUTS: VenueAreaLayout[] = [
  {
    pointBox: { x: 24, y: 19, width: 13, height: 18 },
    bloom: "#2563eb",
  },
  {
    pointBox: { x: 51, y: 14, width: 12, height: 17 },
    bloom: "#16a34a",
  },
  {
    pointBox: { x: 62, y: 9, width: 17, height: 20 },
    bloom: "#dc2626",
  },
  {
    pointBox: { x: 39, y: 31, width: 18, height: 12 },
    bloom: "#eab308",
  },
  {
    pointBox: { x: 58, y: 32, width: 16, height: 11 },
    bloom: "#f97316",
  },
  {
    pointBox: { x: 66, y: 46, width: 10, height: 8 },
    bloom: "#f43f5e",
  },
  {
    pointBox: { x: 68, y: 51, width: 9, height: 7 },
    bloom: "#14b8a6",
  },
  {
    pointBox: { x: 70, y: 54, width: 22, height: 12 },
    bloom: "#16a34a",
  },
];

function getAreaLayout(index: number) {
  return AREA_LAYOUTS[index % AREA_LAYOUTS.length];
}

function getAreaLayoutIndex(areaName: string, fallbackIndex: number) {
  const normalized = areaName.toLowerCase();

  if (normalized.includes("urban") || normalized.includes("gx")) {
    return 0;
  }

  if (normalized.includes("garden") && !normalized.includes("food")) {
    return 1;
  }

  if (normalized.includes("farm") || normalized.includes("food")) {
    return 2;
  }

  if (normalized.includes("craft")) {
    return 3;
  }

  if (normalized.includes("kids")) {
    return 4;
  }

  if (normalized.includes("indoor") || normalized.includes("theme")) {
    return 5;
  }

  if (normalized.includes("culture") || normalized.includes("government")) {
    return 6;
  }

  if (normalized.includes("satoyama") || normalized.includes("花壇")) {
    return 7;
  }

  return fallbackIndex % AREA_LAYOUTS.length;
}

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
  layout: VenueAreaLayout,
  index: number,
  total: number,
) {
  const box = layout.pointBox;
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
    const areaName = areaNameById.get(areaId) ?? "未分類";
    const layout = getAreaLayout(getAreaLayoutIndex(areaName, areaIndex));

    return areaPavilions.map((pavilion, pavilionIndex) => {
      const point = getGridPoint(layout, pavilionIndex, areaPavilions.length);

      return {
        id: pavilion.id,
        name: pavilion.name,
        x: point.x,
        y: point.y,
        visited: visitedIds.has(pavilion.id),
        areaName,
        bloom: layout.bloom,
        imageUrl: pavilion.image_path
          ? getPavilionImageUrl(pavilion.image_path)
          : null,
        size: 1 + ((pavilionIndex * 17) % 3) * 0.16,
        rotation: ((pavilionIndex * 47) % 34) - 17,
      } satisfies PavilionMapPoint;
    });
  });
}

function PavilionPoint({ point }: { point: PavilionMapPoint }) {
  if (!point.visited) {
    return (
      <g>
        <circle
          cx={point.x}
          cy={point.y}
          r="1.7"
          fill="#ffffff"
          stroke="#bfd2cc"
          strokeWidth="0.7"
        />
        <path
          d={`M${point.x} ${point.y - 1.1} C${point.x - 1.2} ${point.y - 2.6} ${point.x - 2.3} ${point.y - 0.4} ${point.x} ${point.y + 1.3} C${point.x + 2.3} ${point.y - 0.4} ${point.x + 1.2} ${point.y - 2.6} ${point.x} ${point.y - 1.1}Z`}
          fill="none"
          stroke="#d1ded9"
          strokeWidth="0.5"
        />
        <title>{`${point.name}（未訪問）`}</title>
      </g>
    );
  }

  const clipId = `pavilion-thumb-${point.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const petalRadius = 1.32 * point.size;
  const glowRadius = 4.3 * point.size;
  const imageRadius = 1.35 * point.size;

  return (
    <g transform={`rotate(${point.rotation} ${point.x} ${point.y})`}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={point.x} cy={point.y} r={imageRadius} />
        </clipPath>
      </defs>
      <circle
        cx={point.x}
        cy={point.y}
        r={glowRadius}
        fill={point.bloom}
        opacity="0.16"
      />
      {[0, 72, 144, 216, 288].map((angle) => {
        const radians = (angle * Math.PI) / 180;
        const petalX = point.x + Math.cos(radians) * (1.35 * point.size);
        const petalY = point.y + Math.sin(radians) * (1.35 * point.size);

        return (
          <ellipse
            key={angle}
            cx={petalX}
            cy={petalY}
            rx={petalRadius * 0.62}
            ry={petalRadius}
            fill={point.bloom}
            transform={`rotate(${angle} ${petalX} ${petalY})`}
          />
        );
      })}
      {point.imageUrl ? (
        <>
          <image
            href={point.imageUrl}
            x={point.x - imageRadius}
            y={point.y - imageRadius}
            width={imageRadius * 2}
            height={imageRadius * 2}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            opacity="0.9"
          />
          <circle
            cx={point.x}
            cy={point.y}
            r={imageRadius}
            fill="none"
            stroke="#fff7ed"
            strokeWidth="0.42"
          />
        </>
      ) : (
        <circle cx={point.x} cy={point.y} r={imageRadius} fill="#fff7ed" />
      )}
      <title>{`${point.name}（訪問済み）`}</title>
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
  const points = buildPavilionPoints({
    areas: mapAreas,
    pavilions,
    visitedIds,
  });
  const visitedCount = points.filter((point) => point.visited).length;
  const unvisitedCount = Math.max(points.length - visitedCount, 0);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#fbfffc_0%,#f8fbff_48%,#fffaf2_100%)] px-3 py-3 ring-1 ring-emerald-100 sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute left-5 top-5 z-10 sm:left-8 sm:top-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700/80">
          制覇マップ
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950/90 sm:text-3xl">
          訪問の記録
        </h2>
      </div>

      <svg
        aria-label="訪問済みと未訪問のパビリオンを示す白地図ベースの制覇マップ"
        className="relative z-0 h-[500px] w-full sm:h-[650px] lg:h-[760px]"
        viewBox="0 0 100 67"
        role="img"
      >
        <image
          href="/prototypes/venue-map-zones.png"
          x="0"
          y="0"
          width="100"
          height="67"
          preserveAspectRatio="xMidYMid meet"
        />

        {points.map((point) => (
          <PavilionPoint key={point.id} point={point} />
        ))}
      </svg>

      <div className="pointer-events-none absolute bottom-5 left-5 z-10 flex items-end gap-5 sm:bottom-8 sm:left-8">
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

      <div className="pointer-events-none absolute bottom-5 right-5 z-10 flex items-center gap-3 text-[11px] font-medium text-slate-500 sm:bottom-8 sm:right-8">
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
