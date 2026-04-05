export type VisitSession = {
  id: string;
  created_at: string;
  user_id: string;
  visit_date: string;
  title: string | null;
  memo: string | null;
  event_id: string | null;
};

export type EventOption = {
  id: string;
  name: string;
};

export type Area = {
  id: string;
  name: string;
  sort_order: number | null;
};

export type Pavilion = {
  id: string;
  name: string;
  official_name: string | null;
  country_id: string | null;
  image_path: string | null;
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
  | "image_path"
  | "area_id"
  | "spot_id"
  | "sort_order"
> & {
  aliases: string[];
};

export type ActivityLogPavilion = Pick<
  Pavilion,
  | "id"
  | "name"
  | "official_name"
  | "country_id"
  | "image_path"
  | "area_id"
  | "spot_id"
>;

export type ActivityLog = {
  id: string;
  created_at: string;
  user_id: string;
  occurred_at: string | null;
  session_id: string;
  event_id: string | null;
  title: string | null;
  memo: string | null;
  activity_type: string | null;
  price: number | null;
  acquisition_method: string | null;
  photo_path: string | null;
  pavilion_id: string | null;
  pavilion: ActivityLogPavilion | null;
};

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
