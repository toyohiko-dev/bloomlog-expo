export type VenueMapBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VenueAreaPlacement = {
  key: string;
  matchers: string[];
  areaBox: VenueMapBox;
  pointBox: VenueMapBox;
  bloom: string;
};

export type VenuePoint = {
  x: number;
  y: number;
};

export type VenuePavilionPlacement = VenuePoint & {
  pavilionId?: string;
  name?: string;
  size?: number;
  rotation?: number;
};

export const VENUE_MAP_ASSET = {
  href: "/prototypes/venue-map-zones.png",
  viewBox: "0 0 100 67",
  width: 100,
  height: 67,
} as const;

export const VENUE_MAP_CANVAS = {
  aspectRatio: "aspect-[100/67]",
  minWidth: "min-w-[980px] sm:min-w-[1180px] lg:min-w-full",
} as const;

// Prototype seed placements. Keep this as the single place to tune Pavilion
// positions until real Pavilion coordinates are available.
export const VENUE_AREA_PLACEMENTS: VenueAreaPlacement[] = [
  {
    key: "urban-gx-village",
    matchers: ["urban", "gx"],
    areaBox: { x: 20, y: 14, width: 20, height: 29 },
    pointBox: { x: 24, y: 19, width: 13, height: 18 },
    bloom: "#2563eb",
  },
  {
    key: "main-garden",
    matchers: ["garden"],
    areaBox: { x: 48, y: 9, width: 17, height: 25 },
    pointBox: { x: 51, y: 14, width: 12, height: 17 },
    bloom: "#16a34a",
  },
  {
    key: "farm-food-village",
    matchers: ["farm", "food"],
    areaBox: { x: 58, y: 6, width: 26, height: 28 },
    pointBox: { x: 62, y: 9, width: 17, height: 20 },
    bloom: "#dc2626",
  },
  {
    key: "craft-village",
    matchers: ["craft"],
    areaBox: { x: 36, y: 27, width: 26, height: 18 },
    pointBox: { x: 39, y: 31, width: 18, height: 12 },
    bloom: "#eab308",
  },
  {
    key: "kids-village",
    matchers: ["kids"],
    areaBox: { x: 55, y: 29, width: 23, height: 17 },
    pointBox: { x: 58, y: 32, width: 16, height: 11 },
    bloom: "#f97316",
  },
  {
    key: "theme-indoor",
    matchers: ["indoor", "theme"],
    areaBox: { x: 64, y: 44, width: 15, height: 11 },
    pointBox: { x: 66, y: 46, width: 10, height: 8 },
    bloom: "#f43f5e",
  },
  {
    key: "culture-government",
    matchers: ["culture", "government"],
    areaBox: { x: 66, y: 49, width: 14, height: 10 },
    pointBox: { x: 68, y: 51, width: 9, height: 7 },
    bloom: "#14b8a6",
  },
  {
    key: "satoyama-village",
    matchers: ["satoyama", "花壇"],
    areaBox: { x: 66, y: 51, width: 29, height: 15 },
    pointBox: { x: 70, y: 54, width: 22, height: 12 },
    bloom: "#16a34a",
  },
];

export const VENUE_PAVILION_PLACEMENTS: VenuePavilionPlacement[] = [];

function normalizePlacementName(name: string) {
  return name.trim().toLowerCase();
}

export function getVenueAreaPlacement(
  areaName: string,
  fallbackIndex: number,
) {
  const normalized = areaName.toLowerCase();
  const placement = VENUE_AREA_PLACEMENTS.find((candidate) =>
    candidate.matchers.some((matcher) => normalized.includes(matcher))
  );

  return placement
    ?? VENUE_AREA_PLACEMENTS[fallbackIndex % VENUE_AREA_PLACEMENTS.length];
}

export function getVenuePavilionPlacement({
  pavilionId,
  name,
}: {
  pavilionId: string;
  name: string;
}) {
  const normalizedName = normalizePlacementName(name);

  return VENUE_PAVILION_PLACEMENTS.find((placement) => {
    if (placement.pavilionId && placement.pavilionId === pavilionId) {
      return true;
    }

    return placement.name
      ? normalizePlacementName(placement.name) === normalizedName
      : false;
  }) ?? null;
}
