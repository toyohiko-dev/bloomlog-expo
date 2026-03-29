import { supabase } from "@/lib/supabase";

export type VisitSession = {
  id: string;
  created_at: string;
  visit_date: string;
  title: string | null;
  memo: string | null;
  event_id: string | null;
};

export type EventOption = {
  id: string;
  name: string;
};

export type Pavilion = {
  id: string;
  name: string;
  official_name: string | null;
  country_id: string | null;
  area_id: string | null;
  spot_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PavilionAlias = {
  alias: string;
};

export type PavilionOption = Pick<
  Pavilion,
  | "id"
  | "name"
  | "official_name"
  | "country_id"
  | "area_id"
  | "spot_id"
  | "sort_order"
> & {
  aliases: string[];
};

export type ActivityLogPavilion = Pick<
  Pavilion,
  "id" | "name" | "official_name" | "country_id" | "area_id" | "spot_id"
>;

export type ActivityLog = {
  id: string;
  created_at: string;
  occurred_at: string | null;
  session_id: string;
  event_id: string | null;
  title: string | null;
  memo: string | null;
  activity_type: string | null;
  price: number | null;
  acquisition_method: string | null;
  pavilion_id: string | null;
  pavilion: ActivityLogPavilion | null;
};

export type PavilionProgressSummary = {
  totalPavilions: number;
  visitedPavilions: number;
  unvisitedPavilions: PavilionOption[];
};

const activityLogSelect = `
  id,
  created_at,
  occurred_at,
  session_id,
  event_id,
  title,
  memo,
  activity_type,
  price,
  acquisition_method,
  pavilion_id,
  pavilion:pavilions (
    id,
    name,
    official_name,
    country_id,
    area_id,
    spot_id
  )
`;

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
  const { data, error } = await supabase
    .from("visit_sessions")
    .select("id, created_at, visit_date, title, memo, event_id")
    .order("visit_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as VisitSession[];
}

export async function getSession(sessionId: string) {
  const { data, error } = await supabase
    .from("visit_sessions")
    .select("id, created_at, visit_date, title, memo, event_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as VisitSession | null;
}

export async function getSessionByVisitDate(visitDate: string) {
  const { data, error } = await supabase
    .from("visit_sessions")
    .select("id, created_at, visit_date, title, memo, event_id")
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
  const { data, error } = await supabase
    .from("visit_sessions")
    .select("id, created_at, visit_date, title, memo, event_id")
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
  const { data, error } = await supabase
    .from("activity_logs")
    .select(activityLogSelect)
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
  const { data, error } = await supabase
    .from("activity_logs")
    .select(activityLogSelect)
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
  const { data, error } = await supabase
    .from("activity_logs")
    .select(activityLogSelect)
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
  const { data, error } = await supabase
    .from("pavilions")
    .select(
      "id, name, official_name, country_id, area_id, spot_id, is_active, sort_order, created_at, updated_at, pavilion_aliases(alias)",
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
    area_id: pavilion.area_id,
    spot_id: pavilion.spot_id,
    sort_order: pavilion.sort_order,
    aliases: (pavilion.pavilion_aliases ?? [])
      .map((entry) => entry.alias.trim())
      .filter(Boolean),
  }));
}

export async function getPavilion(pavilionId: string) {
  const { data, error } = await supabase
    .from("pavilions")
    .select(
      "id, name, official_name, country_id, area_id, spot_id, is_active, sort_order, created_at, updated_at",
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from("events")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EventOption[];
}

export function getActivityLogTitle(log: Pick<ActivityLog, "title" | "pavilion">) {
  return log.pavilion?.name ?? log.title ?? null;
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("ja-JP");
}

export function getPavilionSearchTerms(pavilion: PavilionOption) {
  return Array.from(
    new Set(
      [pavilion.name, pavilion.official_name, ...pavilion.aliases]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function searchPavilions(
  pavilions: PavilionOption[],
  keyword: string,
  limit = 8,
) {
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return [];
  }

  return pavilions
    .map((pavilion) => {
      const terms = getPavilionSearchTerms(pavilion);
      const normalizedName = normalizeSearchText(pavilion.name);
      const normalizedTerms = terms.map(normalizeSearchText);
      let score = Number.POSITIVE_INFINITY;

      if (normalizedName === normalizedKeyword) {
        score = 0;
      } else if (normalizedTerms.some((term) => term === normalizedKeyword)) {
        score = 1;
      } else if (normalizedName.startsWith(normalizedKeyword)) {
        score = 2;
      } else if (
        normalizedTerms.some(
          (term) => term !== normalizedName && term.startsWith(normalizedKeyword),
        )
      ) {
        score = 3;
      } else if (normalizedName.includes(normalizedKeyword)) {
        score = 4;
      } else if (normalizedTerms.some((term) => term.includes(normalizedKeyword))) {
        score = 5;
      }

      return {
        pavilion,
        score,
      };
    })
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      if (left.pavilion.sort_order !== right.pavilion.sort_order) {
        return left.pavilion.sort_order - right.pavilion.sort_order;
      }

      return left.pavilion.name.localeCompare(right.pavilion.name, "ja-JP");
    })
    .slice(0, limit)
    .map((entry) => entry.pavilion);
}

export function todayDateString() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
}
