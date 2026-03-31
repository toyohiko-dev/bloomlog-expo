"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  ActivityLogFieldErrors,
  ActivityLogFormState,
} from "@/lib/activity-log-form-state";
import type {
  SessionFieldErrors,
  SessionFormState,
} from "@/lib/session-form-state";
import {
  normalizeAcquisitionMethod,
  type ActivityType,
} from "@/lib/activity-types";
import { supabase } from "@/lib/supabase";
import {
  getActivityLog,
  getDefaultEventId,
  getPavilion,
  getSession,
  getSessionByVisitDate,
  todayDateString,
} from "@/lib/sessions";

const FIXED_EVENT_KEY = "GREENEXPO2027";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalPrice(value: string) {
  if (!value) {
    return null;
  }

  const price = Number(value);
  return Number.isFinite(price) ? price : Number.NaN;
}

function activityErrorState(
  message: string,
  fieldErrors: ActivityLogFieldErrors = {},
): ActivityLogFormState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

async function getFixedEventId() {
  const candidates = [FIXED_EVENT_KEY, "GREENxEXPO 2027"];

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .or(`id.eq.${candidate},name.eq.${candidate}`)
      .maybeSingle();

    if (!error && data?.id) {
      return data.id;
    }
  }

  return await getDefaultEventId();
}

function buildOccurredAt(visitDate: string, occurredTime: string) {
  if (!occurredTime) {
    return null;
  }

  const datetime = new Date(`${visitDate}T${occurredTime}`);

  if (Number.isNaN(datetime.getTime())) {
    return undefined;
  }

  return datetime.toISOString();
}

async function validateActivityLog(formData: FormData) {
  const sessionId = readText(formData, "sessionId");
  const activityType = readText(formData, "activityType") as ActivityType;
  const pavilionId = readText(formData, "pavilionId");
  const titleInput = readText(formData, "title");
  const memo = readText(formData, "memo");
  const occurredTime = readText(formData, "occurredAt");
  const priceInput = readText(formData, "price");
  const acquisitionMethodInput = readText(formData, "acquisitionMethod");
  const acquisitionMethod = normalizeAcquisitionMethod(acquisitionMethodInput);
  const fieldErrors: ActivityLogFieldErrors = {};

  const allowedActivityTypes = new Set<ActivityType>([
    "pavilion_visit",
    "food",
    "pin",
    "event_participation",
  ]);

  if (!sessionId) {
    return {
      error: activityErrorState("訪問IDが見つかりません。"),
    };
  }

  if (!allowedActivityTypes.has(activityType)) {
    fieldErrors.activityType = "体験の種類を選んでください。";
  }

  let pavilion = null;
  let title = titleInput;

  if (activityType === "pavilion_visit") {
    if (!pavilionId) {
      fieldErrors.pavilionId = "パビリオンを選んでください。";
    } else {
      pavilion = await getPavilion(pavilionId);

      if (!pavilion || !pavilion.is_active) {
        fieldErrors.pavilionId = "選択したパビリオンが見つかりません。";
      } else {
        title = pavilion.name;
      }
    }
  } else if (!title) {
    fieldErrors.title = "名前を入力してください。";
  }

  if (memo.length > 1000) {
    fieldErrors.memo = "メモは1000文字以内で入力してください。";
  }

  const price = parseOptionalPrice(priceInput);

  if (
    (activityType === "food" || activityType === "pin") &&
    priceInput &&
    Number.isNaN(price)
  ) {
    fieldErrors.price = "価格は数字で入力してください。";
  }

  if (activityType === "pin" && !acquisitionMethod) {
    fieldErrors.acquisitionMethod = "入手方法を選んでください。";
  }

  const session = await getSession(sessionId);

  if (!session) {
    return {
      error: activityErrorState("訪問が見つかりません。"),
    };
  }

  const occurredAt = buildOccurredAt(session.visit_date, occurredTime);

  if (occurredAt === undefined) {
    fieldErrors.occurredAt = "正しい時刻を入力してください。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: activityErrorState("入力内容を確認してください。", fieldErrors),
    };
  }

  return {
    values: {
      session,
      sessionId,
      activityType,
      pavilionId: activityType === "pavilion_visit" ? pavilion?.id ?? null : null,
      title,
      memo,
      occurredAt,
      price,
      acquisitionMethod,
    },
  };
}

export async function startTodaySessionAction() {
  const visitDate = todayDateString();
  const existingSession = await getSessionByVisitDate(visitDate);

  if (existingSession) {
    redirect(`/sessions/${existingSession.id}`);
  }

  redirect("/sessions/new");
}

export async function startSessionForDateAction(formData: FormData) {
  const visitDate = readText(formData, "visitDate");

  if (!visitDate) {
    redirect("/");
  }

  const existingSession = await getSessionByVisitDate(visitDate);

  if (existingSession) {
    redirect(`/sessions/${existingSession.id}`);
  }

  redirect(`/sessions/new?visitDate=${encodeURIComponent(visitDate)}`);
}

export async function createSessionAction(
  formData?: FormData,
): Promise<SessionFormState | never> {
  const visitDate = formData ? readText(formData, "visitDate") : todayDateString();
  const title = formData ? readText(formData, "title") : "";
  const notes = formData ? readText(formData, "notes") : "";
  const fieldErrors: SessionFieldErrors = {};

  if (!visitDate) {
    fieldErrors.visitDate = "日付を入力してください。";
  }

  if (notes.length > 1000) {
    fieldErrors.notes = "メモは1000文字以内で入力してください。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "入力内容を確認してください。",
      fieldErrors,
    };
  }

  const existingSession = await getSessionByVisitDate(visitDate);

  if (existingSession) {
    redirect(`/sessions/${existingSession.id}`);
  }

  const fixedEventId = await getFixedEventId();

  const { data, error } = await supabase
    .from("visit_sessions")
    .insert({
      visit_date: visitDate,
      title: title || null,
      memo: notes,
      ...(fixedEventId ? { event_id: fixedEventId } : {}),
    })
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message: `訪問の作成に失敗しました: ${error.message}`,
      fieldErrors,
    };
  }

  revalidatePath("/sessions");
  revalidatePath("/sessions/new");
  redirect(`/sessions/${data.id}`);
}

export async function updateSessionAction(
  formData: FormData,
): Promise<SessionFormState> {
  try {
    const sessionId = String(formData.get("id") ?? "");
    const title = readText(formData, "title");
    const visitDate = readText(formData, "visitDate");
    const notes = readText(formData, "notes");
    const fieldErrors: SessionFieldErrors = {};

    if (!sessionId) {
      return {
        status: "error",
        message: "訪問IDが見つかりません。",
        fieldErrors,
      };
    }

    if (!visitDate) {
      fieldErrors.visitDate = "日付を入力してください。";
    }

    if (notes.length > 1000) {
      fieldErrors.notes = "メモは1000文字以内で入力してください。";
    }

    if (visitDate) {
      const existingSession = await getSessionByVisitDate(visitDate);

      if (existingSession && String(existingSession.id) !== sessionId) {
        fieldErrors.visitDate =
          "同じ日の訪問がすでにあります。既存の訪問を使ってください。";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        status: "error",
        message: "入力内容を確認してください。",
        fieldErrors,
      };
    }

    const fixedEventId = await getFixedEventId();

    const { error } = await supabase
      .from("visit_sessions")
      .update({
        title: title || null,
        visit_date: visitDate,
        memo: notes,
        event_id: fixedEventId ?? null,
      })
      .eq("id", sessionId);

    if (error) {
      return {
        status: "error",
        message: `訪問の更新に失敗しました: ${error.message}`,
        fieldErrors,
      };
    }

    revalidatePath("/sessions");
    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/sessions/${sessionId}/edit`);

    return {
      status: "success",
      message: "訪問を保存しました。",
      fieldErrors: {},
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? `エラーが発生しました: ${error.message}`
          : "訪問の更新に失敗しました。",
      fieldErrors: {},
    };
  }
}

export async function deleteSessionAction(formData: FormData) {
  const sessionId = String(formData.get("id") ?? "");

  if (!sessionId) {
    throw new Error("削除対象の訪問IDが見つかりません。");
  }

  const { error: logsError } = await supabase
    .from("activity_logs")
    .delete()
    .eq("session_id", sessionId);

  if (logsError) {
    throw new Error(`体験の削除に失敗しました: ${logsError.message}`);
  }

  const { error: sessionError } = await supabase
    .from("visit_sessions")
    .delete()
    .eq("id", sessionId);

  if (sessionError) {
    throw new Error(`訪問の削除に失敗しました: ${sessionError.message}`);
  }

  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function deleteActivityLogAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const logId = String(formData.get("logId") ?? "");

  if (!sessionId || !logId) {
    throw new Error("削除対象の体験IDが見つかりません。");
  }

  const { error } = await supabase
    .from("activity_logs")
    .delete()
    .eq("id", logId);

  if (error) {
    throw new Error(`体験の削除に失敗しました: ${error.message}`);
  }

  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}`);
}

export async function submitActivityLogAction(
  formData: FormData,
): Promise<ActivityLogFormState> {
  try {
    const validation = await validateActivityLog(formData);

    if (validation.error) {
      return validation.error;
    }

    const {
      session,
      sessionId,
      activityType,
      pavilionId,
      title,
      memo,
      occurredAt,
      price,
      acquisitionMethod,
    } = validation.values;

    const { error } = await supabase.from("activity_logs").insert({
      session_id: sessionId,
      activity_type: activityType,
      pavilion_id: activityType === "pavilion_visit" ? pavilionId : null,
      title,
      memo,
      occurred_at: occurredAt,
      event_id: session.event_id ?? null,
      price:
        activityType === "food" || activityType === "pin" ? price : null,
      acquisition_method: activityType === "pin" ? acquisitionMethod : null,
    });

    if (error) {
      return activityErrorState(`体験の記録に失敗しました: ${error.message}`);
    }

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/collection");

    return {
      status: "success",
      message: "体験を記録しました。",
      fieldErrors: {},
    };
  } catch (error) {
    return activityErrorState(
      error instanceof Error
        ? `エラーが発生しました: ${error.message}`
        : "体験の記録に失敗しました。",
    );
  }
}

export async function updateActivityLogAction(
  formData: FormData,
): Promise<ActivityLogFormState> {
  try {
    const logId = readText(formData, "logId");
    const validation = await validateActivityLog(formData);

    if (!logId) {
      return activityErrorState("体験IDが見つかりません。");
    }

    if (validation.error) {
      return validation.error;
    }

    const {
      session,
      sessionId,
      activityType,
      pavilionId,
      title,
      memo,
      occurredAt,
      price,
      acquisitionMethod,
    } = validation.values;

    const existingLog = await getActivityLog(logId);

    if (!existingLog || String(existingLog.session_id) !== sessionId) {
      return activityErrorState("編集対象の体験が見つかりません。");
    }

    const { error } = await supabase
      .from("activity_logs")
      .update({
        activity_type: activityType,
        pavilion_id: activityType === "pavilion_visit" ? pavilionId : null,
        title,
        memo,
        occurred_at: occurredAt,
        event_id: session.event_id ?? null,
        price:
          activityType === "food" || activityType === "pin" ? price : null,
        acquisition_method: activityType === "pin" ? acquisitionMethod : null,
      })
      .eq("id", logId);

    if (error) {
      return activityErrorState(`体験の更新に失敗しました: ${error.message}`);
    }

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/sessions/${sessionId}/activity-logs/${logId}/edit`);
    revalidatePath("/collection");

    return {
      status: "success",
      message: "体験を更新しました。",
      fieldErrors: {},
    };
  } catch (error) {
    return activityErrorState(
      error instanceof Error
        ? `エラーが発生しました: ${error.message}`
        : "体験の更新に失敗しました。",
    );
  }
}
