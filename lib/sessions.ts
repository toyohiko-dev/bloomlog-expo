import { requireUser } from "@/lib/auth";
import {
  type ActivityLog,
  type ActivityLogPavilion,
  type Area,
  type EventOption,
  getActivityLogTitle,
  type Pavilion,
  type PavilionAlias,
  type PavilionOption,
  type VisitSession,
} from "@/lib/session-shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPublicSupabaseClient } from "@/lib/supabase/shared";

export { getActivityLogTitle } from "@/lib/session-shared";

export type PavilionProgressSummary = {
  totalPavilions: number;
  visitedPavilions: number;
  unvisitedPavilions: PavilionOption[];
};

export type PavilionCollectionItem = {
  key: string;
  pavilionId: string | null;
  areaId: string | null;
  title: string;
  count: number;
  firstVisitedAt: string | null;
  latestVisitedAt: string | null;
  latestSessionId: string;
  countryId: string | null;
  imagePath: string | null;
};

export type AreaGroupedPavilionTreemapLeaf = PavilionCollectionItem & {
  name: string;
  value: number;
};

export type AreaGroupedPavilionTreemapGroup = {
  areaId: string;
  name: string;
  children: AreaGroupedPavilionTreemapLeaf[];
};

export type AreaTreemapItem = {
  areaId: string;
  name: string;
  value: number;
};

export type PavilionAlbumTileSpan = {
  colSpan: 1 | 2 | 3;
  rowSpan: 1 | 2;
};

export type PavilionAlbumHeroTile = PavilionCollectionItem &
  PavilionAlbumTileSpan & {
    rank: number;
  };

export type PavilionAlbumLayout = {
  heroTiles: PavilionAlbumHeroTile[];
  collectionTiles: PavilionCollectionItem[];
};

const activityLogSelect = `
  id,
  created_at,
  user_id,
  occurred_at,
  session_id,
  event_id,
  title,
  memo,
  activity_type,
  price,
  acquisition_method,
  photo_path,
  pavilion_id,
  pavilion:pavilions (
    id,
    name,
    official_name,
    country_id,
    image_path,
    area_id,
    spot_id
  )
`;

const publicSupabase = createPublicSupabaseClient();

async function getUserScopedSupabase() {
  const [supabase, user] = await Promise.all([
    createServerSupabaseClient(),
    requireUser(),
  ]);

  return { supabase, user };
}

function normalizeActivityLog(
  log: Omit<ActivityLog, "pavilion"> & {
    pavilion: ActivityLogPavilion | ActivityLogPavilion[] | null;
  },
): ActivityLog {
  return {
    ...log,
    pavilion: Array.isArray(log.pavilion) ? (log.pavilion[0] ?? null) : log.pavilion,
  };
}

export async function listSessions() {
  const { supabase, user } = await getUserScopedSupabase();
  const { data, error } = await supabase
    .from("visit_sessions")
    .select("id, created_at, user_id, visit_date, title, memo, event_id")
    .eq("user_id", user.id)
    .order("visit_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as VisitSession[];
}

export async function getSession(sessionId: string) {
  const { supabase, user } = await getUserScopedSupabase();
  const { data, error } = await supabase
    .from("visit_sessions")
    .select("id, created_at, user_id, visit_date, title, memo, event_id")
    .eq("user_id", user.id)
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as VisitSession | null;
}

export async function getSessionByVisitDate(visitDate: string) {
  const { supabase, user } = await getUserScopedSupabase();
  const { data, error } = await supabase
    .from("visit_sessions")
    .select("id, created_at, user_id, visit_date, title, memo, event_id")
    .eq("user_id", user.id)
    .eq("visit_date", visitDate)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as VisitSession | null;
}

export async function getAnotherSessionByVisitDate(
  visitDate: string,
  currentSessionId: string,
) {
  const { supabase, user } = await getUserScopedSupabase();
  const { data, error } = await supabase
    .from("visit_sessions")
    .select("id, created_at, user_id, visit_date, title, memo, event_id")
    .eq("user_id", user.id)
    .eq("visit_date", visitDate)
    .neq("id", currentSessionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as VisitSession | null;
}

export async function listActivityLogs(sessionId: string) {
  const { supabase, user } = await getUserScopedSupabase();
  const { data, error } = await supabase
    .from("activity_logs")
    .select(activityLogSelect)
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<
    Omit<ActivityLog, "pavilion"> & {
      pavilion: ActivityLogPavilion | ActivityLogPavilion[] | null;
    }
  >)
    .map(normalizeActivityLog)
    .sort((left, right) => {
    if (left.occurred_at && right.occurred_at) {
      return (
        new Date(left.occurred_at).getTime() - new Date(right.occurred_at).getTime()
      );
    }

    if (left.occurred_at && !right.occurred_at) {
      return -1;
    }

    if (!left.occurred_at && right.occurred_at) {
      return 1;
    }
      return (
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      );
    });
}

export async function getActivityLog(logId: string) {
  const { supabase, user } = await getUserScopedSupabase();
  const { data, error } = await supabase
    .from("activity_logs")
    .select(activityLogSelect)
    .eq("user_id", user.id)
    .eq("id", logId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data
    ? normalizeActivityLog(
        data as Omit<ActivityLog, "pavilion"> & {
          pavilion: ActivityLogPavilion | ActivityLogPavilion[] | null;
        },
      )
    : null;
}

export async function listCollectionActivityLogs() {
  const { supabase, user } = await getUserScopedSupabase();
  const { data, error } = await supabase
    .from("activity_logs")
    .select(activityLogSelect)
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<
    Omit<ActivityLog, "pavilion"> & {
      pavilion: ActivityLogPavilion | ActivityLogPavilion[] | null;
    }
  >).map(normalizeActivityLog);
}

export async function listPavilions() {
  const { data, error } = await publicSupabase
    .from("pavilions")
    .select(
      "id, name, official_name, country_id, image_path, area_id, spot_id, is_active, sort_order, created_at, updated_at, pavilion_aliases(alias)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<
    Pavilion & {
      pavilion_aliases?: PavilionAlias[] | null;
    }
  >).map((pavilion) => ({
    id: pavilion.id,
    name: pavilion.name,
    official_name: pavilion.official_name,
    country_id: pavilion.country_id,
    image_path: pavilion.image_path,
    area_id: pavilion.area_id,
    spot_id: pavilion.spot_id,
    sort_order: pavilion.sort_order,
    aliases: (pavilion.pavilion_aliases ?? [])
      .map((entry) => entry.alias.trim())
      .filter(Boolean),
  }));
}

export async function listAreas() {
  const { data, error } = await publicSupabase
    .from("areas")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  console.log("[collection-next] listAreas raw result", {
    hasError: Boolean(error),
    errorMessage: error?.message ?? null,
    rowCount: data?.length ?? 0,
    rows: data ?? [],
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Area[];
}

export async function getPavilion(pavilionId: string) {
  const { data, error } = await publicSupabase
    .from("pavilions")
    .select(
      "id, name, official_name, country_id, image_path, area_id, spot_id, is_active, sort_order, created_at, updated_at",
    )
    .eq("id", pavilionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Pavilion | null;
}

export async function getPavilionProgressSummary() {
  const [pavilions, logs] = await Promise.all([
    listPavilions(),
    listCollectionActivityLogs(),
  ]);

  const visitedIds = new Set(
    logs
      .filter(
        (log) => log.activity_type === "pavilion_visit" && Boolean(log.pavilion_id),
      )
      .map((log) => String(log.pavilion_id)),
  );

  return {
    totalPavilions: pavilions.length,
    visitedPavilions: visitedIds.size,
    unvisitedPavilions: pavilions.filter((pavilion) => !visitedIds.has(pavilion.id)),
  } satisfies PavilionProgressSummary;
}

export async function getDefaultEventId() {
  const { data, error } = await publicSupabase
    .from("events")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.id ?? null;
}

export async function listEvents() {
  const { data, error } = await publicSupabase
    .from("events")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EventOption[];
}

function getVisitedTimestamp(log: Pick<ActivityLog, "occurred_at" | "created_at">) {
  return log.occurred_at ?? log.created_at;
}

function getPavilionCollectionKey(log: Pick<ActivityLog, "pavilion_id" | "title" | "pavilion">) {
  const title = getActivityLogTitle(log) ?? "未設定";

  return log.pavilion_id
    ? `pavilion:${log.pavilion_id}`
    : `legacy:${title.trim().toLocaleLowerCase("ja-JP")}`;
}

function comparePavilionCollectionItems(
  left: Pick<PavilionCollectionItem, "count" | "latestVisitedAt" | "title">,
  right: Pick<PavilionCollectionItem, "count" | "latestVisitedAt" | "title">,
) {
  if (left.count !== right.count) {
    return right.count - left.count;
  }

  const leftLatestVisitedAt = left.latestVisitedAt
    ? new Date(left.latestVisitedAt).getTime()
    : 0;
  const rightLatestVisitedAt = right.latestVisitedAt
    ? new Date(right.latestVisitedAt).getTime()
    : 0;

  if (leftLatestVisitedAt !== rightLatestVisitedAt) {
    return rightLatestVisitedAt - leftLatestVisitedAt;
  }

  return left.title.localeCompare(right.title, "ja-JP");
}

export function buildPavilionCollection(logs: ActivityLog[]) {
  const groups = new Map<string, PavilionCollectionItem>();

  for (const log of logs) {
    if (log.activity_type !== "pavilion_visit") {
      continue;
    }

    const title = getActivityLogTitle(log) ?? "未設定";
    const key = getPavilionCollectionKey(log);
    const timestamp = getVisitedTimestamp(log);
    const current = groups.get(key);

    if (!current) {
      groups.set(key, {
        key,
        pavilionId: log.pavilion_id,
        areaId: log.pavilion?.area_id ?? null,
        title,
        count: 1,
        firstVisitedAt: timestamp,
        latestVisitedAt: timestamp,
        latestSessionId: log.session_id,
        countryId: log.pavilion?.country_id ?? null,
        imagePath: log.pavilion?.image_path ?? null,
      });
      continue;
    }

    current.count += 1;

    if (
      current.firstVisitedAt === null ||
      new Date(timestamp).getTime() < new Date(current.firstVisitedAt).getTime()
    ) {
      current.firstVisitedAt = timestamp;
    }

    if (
      current.latestVisitedAt === null ||
      new Date(timestamp).getTime() > new Date(current.latestVisitedAt).getTime()
    ) {
      current.latestVisitedAt = timestamp;
      current.latestSessionId = log.session_id;
    }
  }

  const items = Array.from(groups.values()).sort(comparePavilionCollectionItems);
  const spotlightTitles = new Set([
    "アメリカ館",
    "インドネシア館",
    "大阪パビリオン",
    "庭園パビリオン",
  ]);
  const spotlightItems = items
    .filter((item) => spotlightTitles.has(item.title))
    .map((item) => ({
      name: item.title,
      areaId: item.areaId,
      pavilionId: item.pavilionId,
      count: item.count,
    }));

  console.log("[collection-next] buildPavilionCollection items", {
    total: items.length,
    firstItems: items.slice(0, 12).map((item) => ({
      name: item.title,
      areaId: item.areaId,
      count: item.count,
    })),
    spotlightItems,
  });

  return items;
}

const UNCATEGORIZED_AREA_ID = "uncategorized";
const UNCATEGORIZED_AREA_NAME = "Uncategorized";

function compareAreaGroups(
  left: AreaGroupedPavilionTreemapGroup,
  right: AreaGroupedPavilionTreemapGroup,
) {
  if (left.name === UNCATEGORIZED_AREA_NAME && right.name !== UNCATEGORIZED_AREA_NAME) {
    return 1;
  }

  if (left.name !== UNCATEGORIZED_AREA_NAME && right.name === UNCATEGORIZED_AREA_NAME) {
    return -1;
  }

  return left.name.localeCompare(right.name, "en");
}

export function buildAreaGroupedPavilionTreemapData(
  items: PavilionCollectionItem[],
  areas: Area[],
) {
  const areaNameById = new Map(
    areas.map((area) => [String(area.id), area.name] as const),
  );
  const groups = new Map<string, AreaGroupedPavilionTreemapGroup>();

  for (const item of items) {
    const resolvedAreaId = item.areaId && areaNameById.has(item.areaId)
      ? item.areaId
      : UNCATEGORIZED_AREA_ID;
    const resolvedAreaName = resolvedAreaId === UNCATEGORIZED_AREA_ID
      ? UNCATEGORIZED_AREA_NAME
      : areaNameById.get(resolvedAreaId) ?? UNCATEGORIZED_AREA_NAME;
    const currentGroup = groups.get(resolvedAreaId);
    const leaf: AreaGroupedPavilionTreemapLeaf = {
      ...item,
      areaId: resolvedAreaId === UNCATEGORIZED_AREA_ID ? null : resolvedAreaId,
      name: item.title,
      value: item.count,
    };

    if (!currentGroup) {
      groups.set(resolvedAreaId, {
        areaId: resolvedAreaId,
        name: resolvedAreaName,
        children: [leaf],
      });
      continue;
    }

    currentGroup.children.push(leaf);
  }

  const groupedItems = Array.from(groups.values())
    .map((group) => ({
      ...group,
      children: group.children.sort(comparePavilionCollectionItems),
    }))
    .sort(compareAreaGroups);

  console.log("[collection-next] buildAreaGroupedPavilionTreemapData", {
    inputCount: items.length,
    inputFirstItems: items.slice(0, 12).map((item) => ({
      name: item.title,
      areaId: item.areaId,
      count: item.count,
    })),
    areaKeySample: Array.from(areaNameById.entries()).slice(0, 12),
    groupedSummary: groupedItems.map((group) => ({
      areaId: group.areaId,
      name: group.name,
      childCount: group.children.length,
      firstChildren: group.children.slice(0, 5).map((child) => ({
        name: child.title,
        areaId: child.areaId,
        count: child.count,
      })),
    })),
  });

  return groupedItems;
}

export function buildAreaTreemapData(
  items: PavilionCollectionItem[],
  areas: Area[],
) {
  const areaNameById = new Map(
    areas.map((area) => [String(area.id), area.name] as const),
  );
  const countsByAreaId = new Map<string, number>();

  for (const item of items) {
    if (!item.areaId) {
      continue;
    }

    countsByAreaId.set(
      item.areaId,
      (countsByAreaId.get(item.areaId) ?? 0) + item.count,
    );
  }

  const treemapItems = Array.from(countsByAreaId.entries())
    .map(([areaId, value]) => ({
      areaId,
      name: areaNameById.get(areaId) ?? areaId,
      value,
    }))
    .sort((left, right) => {
      if (left.value !== right.value) {
        return right.value - left.value;
      }

      return left.name.localeCompare(right.name, "en");
    });

  console.log("[collection-next] buildAreaTreemapData", {
    inputCount: items.length,
    areaCount: areas.length,
    items: treemapItems,
  });

  return treemapItems satisfies AreaTreemapItem[];
}

function getHeroTileSpan(rank: number): PavilionAlbumTileSpan {
  if (rank === 1) {
    return {
      colSpan: 3,
      rowSpan: 2,
    };
  }

  if (rank <= 3) {
    return {
      colSpan: 2,
      rowSpan: 2,
    };
  }

  return {
    colSpan: 2,
    rowSpan: 1,
  };
}

export function buildPavilionAlbumLayout(
  items: PavilionCollectionItem[],
): PavilionAlbumLayout {
  return {
    heroTiles: items.slice(0, 8).map((item, index) => ({
      ...item,
      rank: index + 1,
      ...getHeroTileSpan(index + 1),
    })),
    collectionTiles: items.slice(8),
  };
}

export function todayDateString() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
}
