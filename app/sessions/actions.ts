"use server";
import {mapPointStorageEnabled} from '@/lib/map-point-config';
import {validateMapPoint,resolveMapPointEdit} from '@/lib/memory-map-point';
import {assertPreparedActivityPhoto} from "@/lib/activity-photo-upload";
import {sameActivityAttempt} from '@/lib/activity-save-attempt';
import {placeContextStorageEnabled} from '@/lib/place-context-config';
import {validatePlaceContext} from '@/lib/place-context';
import {greenExpoResearch} from '@/lib/green-expo-research';


import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanupUncommittedActivityPhoto } from "@/lib/activity-photo-cleanup";
import { requireUser } from "@/lib/auth";
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
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPublicSupabaseClient } from "@/lib/supabase/shared";
import {
  getActivityLog,
  getDefaultEventId,
  getPavilion,
  getSession,
  getSessionByVisitDate,
  todayDateString,
} from "@/lib/sessions";

import {placeRegistry} from "@/lib/place-coordinate-catalog";
import {canUsePavilionInEvent,reviewedBindings} from "@/lib/place-registry";
import {listEvents} from "@/lib/sessions";

const FIXED_EVENT_KEY = "GREENEXPO2027";
const ACTIVITY_PHOTO_BUCKET = "activity-photos";
const ACTIVITY_PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const publicSupabase = createPublicSupabaseClient();

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

function readPhotoFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function getPhotoExtension(file: File) {
  const mimeExtension = ACTIVITY_PHOTO_EXTENSIONS[file.type];

  if (mimeExtension) {
    return mimeExtension;
  }

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    return "jpg";
  }

  if (fileName.endsWith(".png")) {
    return "png";
  }

  if (fileName.endsWith(".webp")) {
    return "webp";
  }

  return null;
}

function buildActivityPhotoPath(
  userId: string,
  sessionId: string,
  activityId: string,
  extension: string,
) {
  return `${userId}/${sessionId}/${activityId}-${crypto.randomUUID()}.${extension}`;
}

async function uploadActivityPhoto(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  sessionId: string,
  activityId: string,
  file: File,
) {
  await assertPreparedActivityPhoto(file);
  const extension = getPhotoExtension(file);

  if (!extension) {
    throw new Error("Unsupported photo file type.");
  }

  const photoPath = buildActivityPhotoPath(
    userId,
    sessionId,
    activityId,
    extension,
  );

  const { error } = await supabase.storage
    .from(ACTIVITY_PHOTO_BUCKET)
    .upload(photoPath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw new Error(error.message);
  }

  return photoPath;
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
    const { data, error } = await publicSupabase
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

  const datetime = new Date(`${visitDate}T${occurredTime}+09:00`);

  if (Number.isNaN(datetime.getTime())) {
    return undefined;
  }

  return datetime.toISOString();
}

async function validateActivityLog(formData: FormData, original?: {pavilion_id:string|null;session_id:string;place_context?:unknown;map_point?:unknown}) {
  const sessionId = readText(formData, "sessionId");
  const activityType = readText(formData, "activityType") as ActivityType;
  const pavilionId = readText(formData, "pavilionId");
  const titleInput = readText(formData, "title");
  const memo = readText(formData, "memo");
  const occurredTime = readText(formData, "occurredAt");
  const priceInput = readText(formData, "price");
  const acquisitionMethodInput = readText(formData, "acquisitionMethod");
  const acquisitionMethod = normalizeAcquisitionMethod(acquisitionMethodInput);
  const photo = readPhotoFile(formData, "photo");
  const fieldErrors: ActivityLogFieldErrors = {};

  const allowedActivityTypes = new Set<ActivityType>([
    "pavilion_visit",
    "food",
    "pin",
    "event_participation",
  ]);

  if (!sessionId) {
    return {
      error: activityErrorState("\u30bb\u30c3\u30b7\u30e7\u30f3ID\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002"),
    };
  }

  if (!allowedActivityTypes.has(activityType)) {
    fieldErrors.activityType = "\u4f53\u9a13\u306e\u7a2e\u985e\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002";
  }

  let pavilion = null;
  let title = titleInput;

  if (activityType === "pavilion_visit" || pavilionId) {
    if (!pavilionId) {
      fieldErrors.pavilionId = "\u30d1\u30d3\u30ea\u30aa\u30f3\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002";
    } else {
      pavilion = await getPavilion(pavilionId);

      if (!pavilion || !pavilion.is_active) {
        fieldErrors.pavilionId = "\u9078\u629e\u3057\u305f\u30d1\u30d3\u30ea\u30aa\u30f3\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002";
      } else {
        if (activityType === "pavilion_visit") title = pavilion.name;
      }
    }
  }
  if (activityType !== "pavilion_visit" && !title) {
    fieldErrors.title = "\u540d\u524d\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
  }

  if (memo.length > 1000) {
    fieldErrors.memo = "\u30e1\u30e2\u306f1000\u6587\u5b57\u4ee5\u5185\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
  }

  const price = parseOptionalPrice(priceInput);

  if (
    (activityType === "food" || activityType === "pin") &&
    priceInput &&
    Number.isNaN(price)
  ) {
    fieldErrors.price = "\u4fa1\u683c\u306f\u6570\u5b57\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
  }

  if (activityType === "pin" && !acquisitionMethod) {
    fieldErrors.acquisitionMethod = "\u5165\u624b\u65b9\u6cd5\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002";
  }


  if (photo && !getPhotoExtension(photo)) {
    fieldErrors.photo = "jpg / png / webp \u306e\u753b\u50cf\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
  }

  const session = await getSession(sessionId);

  if (!session) {
    return {
      error: activityErrorState("\u30bb\u30c3\u30b7\u30e7\u30f3\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002"),
    };
  }

  if(pavilion && !canUsePavilionInEvent(placeRegistry,session.event_id??null,pavilion.id) && !(original?.pavilion_id===pavilion.id && original.session_id===sessionId)){
    return {error:activityErrorState("この来場日の施設として未対応です。場所を選び直してください。",{pavilionId:"イベントに対応する施設を選んでください。"})};
  }
  const contextInput=formData.has('placeContext')?readText(formData,'placeContext'):original?.place_context??null;
  if(!placeContextStorageEnabled&&contextInput)return {error:activityErrorState('場所の詳細を保存する準備が完了していません。入力は保持しています。',{pavilionId:'場所の詳細は登録準備中です。'})};
  const contextResult=validatePlaceContext(contextInput,{catalog:greenExpoResearch,eventId:session.event_id??null,visitDate:session.visit_date,pavilionId:pavilion?.id??null,bindings:new Map(reviewedBindings(placeRegistry).filter(p=>p.pavilionId).map(p=>[p.sourceId,p.pavilionId!]))});
  if(!contextResult.ok)return {error:activityErrorState(contextResult.error,{pavilionId:contextResult.error})};
  const pointInput=formData.has('mapPoint')?readText(formData,'mapPoint'):null;
  if(!mapPointStorageEnabled&&pointInput)return {error:activityErrorState('地図の任意位置はまだ保存できません。入力は保持しています。',{pavilionId:'地図位置は準備中です。'})};
  const pointContext={eventId:session.event_id??null,pavilionId:pavilion?.id??null,activityType};
  const pointResult=original?resolveMapPointEdit({present:formData.has('mapPoint'),value:pointInput},original.map_point??null,pointContext):validateMapPoint(pointInput,pointContext);
  if(!pointResult.ok)return {error:activityErrorState('写真の地図位置を確認・確定してください。入力は保持しています。',{pavilionId:'別イベント・地図版・施設訪問との併用、未確定の位置は保存できません。'})};
  const occurredAt = buildOccurredAt(session.visit_date, occurredTime);

  if (occurredAt === undefined) {
    fieldErrors.occurredAt = "\u6b63\u3057\u3044\u6642\u523b\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: activityErrorState("\u5165\u529b\u5185\u5bb9\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002", fieldErrors),
    };
  }

  return {
    values: {
      session,
      sessionId,
      activityType,
      pavilionId: pavilion?.id ?? null,
      title,
      memo,
      occurredAt,
      price,
      acquisitionMethod,
      photo,
      placeContext:contextResult.ok?contextResult.value:null,
      mapPoint:pointResult.value,
      writeMapPoint:mapPointStorageEnabled&&(!original||formData.has("mapPoint")),
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
  const [supabase, user] = await Promise.all([
    createServerSupabaseClient(),
    requireUser(),
  ]);
  const visitDate = formData ? readText(formData, "visitDate") : todayDateString();
  const title = formData ? readText(formData, "title") : "";
  const notes = formData ? readText(formData, "notes") : "";
  const fieldErrors: SessionFieldErrors = {};

  if (!visitDate) {
    fieldErrors.visitDate = "\u65e5\u4ed8\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
  }

  if (notes.length > 1000) {
    fieldErrors.notes = "\u30e1\u30e2\u306f1000\u6587\u5b57\u4ee5\u5185\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "\u5165\u529b\u5185\u5bb9\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
      fieldErrors,
    };
  }

  const explicitEvent = Boolean(formData?.has("eventId"));
  const selectedEventId = explicitEvent ? readText(formData!,"eventId") : await getFixedEventId();
  if(selectedEventId && explicitEvent && !(await listEvents()).some(event=>event.id===selectedEventId)) return {status:"error",message:"選択したイベントが見つかりません。",fieldErrors:{eventId:"イベントを選び直してください。"}};
  const existingSession = await getSessionByVisitDate(visitDate);

  if (existingSession && explicitEvent && (existingSession.event_id??"")!==(selectedEventId??"")) return {status:"error",message:"この日には別イベントの来場日があります。既存の来場日は変更していません。",fieldErrors:{visitDate:"同日の別イベントは既存データとDB制約の確認が必要です。"}};
  if (existingSession) {
    redirect(`/sessions/${existingSession.id}`);
  }



  const { data, error } = await supabase
    .from("visit_sessions")
    .insert({
      user_id: user.id,
      visit_date: visitDate,
      title: title || null,
      memo: notes,
      event_id: selectedEventId || null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message: "\u6765\u5834\u65e5\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002",
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
    const [supabase, user] = await Promise.all([
      createServerSupabaseClient(),
      requireUser(),
    ]);
    const sessionId = String(formData.get("id") ?? "");
    const title = readText(formData, "title");
    const visitDate = readText(formData, "visitDate");
    const notes = readText(formData, "notes");
    const fieldErrors: SessionFieldErrors = {};

    if (!sessionId) {
      return {
        status: "error",
        message: "\u30bb\u30c3\u30b7\u30e7\u30f3ID\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002",
        fieldErrors,
      };
    }

    if (!visitDate) {
      fieldErrors.visitDate = "\u65e5\u4ed8\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
    }

    if (notes.length > 1000) {
      fieldErrors.notes = "\u30e1\u30e2\u306f1000\u6587\u5b57\u4ee5\u5185\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
    }

    if (visitDate) {
      const existingSession = await getSessionByVisitDate(visitDate);

      if (existingSession && String(existingSession.id) !== sessionId) {
        fieldErrors.visitDate =
          "\u540c\u3058\u65e5\u306e\u30bb\u30c3\u30b7\u30e7\u30f3\u304c\u3059\u3067\u306b\u3042\u308a\u307e\u3059\u3002\u65e2\u5b58\u306e\u30bb\u30c3\u30b7\u30e7\u30f3\u3092\u4f7f\u3063\u3066\u304f\u3060\u3055\u3044\u3002";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        status: "error",
        message: "\u5165\u529b\u5185\u5bb9\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
        fieldErrors,
      };
    }



    const { error } = await supabase
      .from("visit_sessions")
      .update({
        user_id: user.id,
        title: title || null,
        visit_date: visitDate,
        memo: notes,

      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (error) {
      return {
        status: "error",
        message: "\u6765\u5834\u65e5\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002",
        fieldErrors,
      };
    }

    revalidatePath("/sessions");
    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/sessions/${sessionId}/edit`);

    return {
      status: "success",
      message: "\u30bb\u30c3\u30b7\u30e7\u30f3\u3092\u4fdd\u5b58\u3057\u307e\u3057\u305f\u3002",
      fieldErrors: {},
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? `\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f: ${error.message}`
          : "\u30bb\u30c3\u30b7\u30e7\u30f3\u306e\u66f4\u65b0\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002",
      fieldErrors: {},
    };
  }
}

export async function deleteSessionAction(formData: FormData) {
  const [supabase, user] = await Promise.all([
    createServerSupabaseClient(),
    requireUser(),
  ]);
  const sessionId = String(formData.get("id") ?? "");

  if (!sessionId) {
    throw new Error("\u524a\u9664\u5bfe\u8c61\u306e\u30bb\u30c3\u30b7\u30e7\u30f3ID\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002");
  }

  const { data: deletedLogs, error: logsError } = await supabase
    .from("activity_logs")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .select("photo_path");

  if (logsError) {
    throw new Error("\u524a\u9664\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002");
  }

  for (const log of deletedLogs ?? []) {
    await cleanupUncommittedActivityPhoto(supabase, user.id, log.photo_path);
  }

  const { error: sessionError } = await supabase
    .from("visit_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (sessionError) {
    throw new Error("\u524a\u9664\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002");
  }

  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function deleteActivityLogAction(formData: FormData) {
  const [supabase, user] = await Promise.all([
    createServerSupabaseClient(),
    requireUser(),
  ]);
  const sessionId = String(formData.get("sessionId") ?? "");
  const logId = String(formData.get("logId") ?? "");

  if (!sessionId || !logId) {
    throw new Error("\u524a\u9664\u5bfe\u8c61\u306e\u4f53\u9a13ID\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002");
  }

  const { data: deletedLogs, error } = await supabase
    .from("activity_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.id)
    .select("photo_path");

  if (error) {
    throw new Error("\u524a\u9664\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002");
  }

  for (const log of deletedLogs ?? []) {
    await cleanupUncommittedActivityPhoto(supabase, user.id, log.photo_path);
  }

  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}`);
}

export async function submitActivityLogAction(
  formData: FormData,
): Promise<ActivityLogFormState> {
  let uploadedPhoto: Parameters<typeof cleanupUncommittedActivityPhoto> | undefined;
  try {
    const [supabase, user] = await Promise.all([
      createServerSupabaseClient(),
      requireUser(),
    ]);
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
      photo,
      placeContext,
      mapPoint,writeMapPoint,
    } = validation.values;

    const attemptId=readText(formData,'saveAttemptId');
    if(attemptId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId))return activityErrorState('保存操作をやり直してください。');
    const logId=attemptId||crypto.randomUUID();
    const expected={user_id:user.id,session_id:sessionId,activity_type:activityType,pavilion_id:pavilionId,title,memo,occurred_at:occurredAt,event_id:session.event_id??null,price:activityType==='food'||activityType==='pin'?price:null,acquisition_method:activityType==='pin'?acquisitionMethod:null,...(placeContextStorageEnabled?{place_context:placeContext}:{}),...(writeMapPoint?{map_point:mapPoint}:{})};
    if(attemptId){const saved=await getActivityLog(attemptId);if(saved){
      if(readText(formData,'saveAttemptChanged')==='true'||!sameActivityAttempt(saved,expected))return {...activityErrorState('この操作は既に保存されています。入力は保持しています。保存済みの記録を開いて確認・編集してください。'),recoveryHref:`/sessions/${saved.session_id}/activity-logs/${saved.id}/edit`};
      revalidatePath(`/sessions/${sessionId}`);revalidatePath('/collection');revalidatePath('/collection-next');revalidatePath('/');
      return {status:'success',message:'保存済みの記録を確認しました。',fieldErrors:{}};
    }}
    const photoPath =
      photo
        ? await uploadActivityPhoto(supabase, user.id, sessionId, logId, photo)
        : null;
    if (photoPath) uploadedPhoto = [supabase, user.id, photoPath];

    const { error } = await supabase.from("activity_logs").insert({
      id: logId,
      user_id: user.id,
      session_id: sessionId,
      activity_type: activityType,
      pavilion_id: pavilionId,
      title,
      memo,
      occurred_at: occurredAt,
      event_id: session.event_id ?? null,
      price:
        activityType === "food" || activityType === "pin" ? price : null,
      acquisition_method: activityType === "pin" ? acquisitionMethod : null,
      photo_path: photoPath,
      ...(placeContextStorageEnabled?{place_context:placeContext}:{}),...(writeMapPoint?{map_point:mapPoint}:{}),
    });

    if (error) {
      await cleanupUncommittedActivityPhoto(supabase,user.id,photoPath);uploadedPhoto=undefined;
      if(attemptId&&error.code==='23505'){const saved=await getActivityLog(attemptId);if(saved&&(readText(formData,'saveAttemptChanged')==='true'||!sameActivityAttempt(saved,expected)))return {...activityErrorState('保存済みの記録があります。入力は保持しています。確認して編集してください。'),recoveryHref:`/sessions/${saved.session_id}/activity-logs/${saved.id}/edit`};if(saved&&sameActivityAttempt(saved,expected)){revalidatePath(`/sessions/${sessionId}`);revalidatePath('/collection');revalidatePath('/collection-next');revalidatePath('/');return {status:'success',message:'保存済みの記録を確認しました。',fieldErrors:{}};}}
      return activityErrorState('記録の保存に失敗しました。');
    }

    uploadedPhoto = undefined;

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/collection");
    revalidatePath("/collection-next");revalidatePath("/");

    return {
      status: "success",
      message: "\u4f53\u9a13\u3092\u8a18\u9332\u3057\u307e\u3057\u305f\u3002",
      fieldErrors: {},
    };
  } catch (error) {
    if (uploadedPhoto) await cleanupUncommittedActivityPhoto(...uploadedPhoto);
    return activityErrorState(
      error instanceof Error
        ? `\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f: ${error.message}`
        : "記録の保存に失敗しました。"
    );
  }
}

export async function updateActivityLogAction(
  formData: FormData,
): Promise<ActivityLogFormState> {
  let uploadedPhoto: Parameters<typeof cleanupUncommittedActivityPhoto> | undefined;
  try {
    const [supabase, user] = await Promise.all([
      createServerSupabaseClient(),
      requireUser(),
    ]);
    const logId = readText(formData, "logId");
    const existingLog = logId ? await getActivityLog(logId) : null;
    const validation = await validateActivityLog(formData,existingLog??undefined);

    if (!logId) {
      return activityErrorState("\u4f53\u9a13ID\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002");
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
      photo,
      placeContext,
      mapPoint,writeMapPoint,
    } = validation.values;



    if (!existingLog || String(existingLog.session_id) !== sessionId) {
      return activityErrorState("\u7de8\u96c6\u5bfe\u8c61\u306e\u4f53\u9a13\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002");
    }

    const photoPath =
      photo
        ? await uploadActivityPhoto(supabase, user.id, sessionId, logId, photo)
        : existingLog.photo_path;
    if (photo && photoPath) uploadedPhoto = [supabase, user.id, photoPath];

    const update = supabase
      .from("activity_logs")
      .update({
        user_id: user.id,
        activity_type: activityType,
        pavilion_id: pavilionId,
        title,
        memo,
        occurred_at: occurredAt,
        event_id: session.event_id ?? null,
        price:
          activityType === "food" || activityType === "pin" ? price : null,
        acquisition_method: activityType === "pin" ? acquisitionMethod : null,
        photo_path: photoPath,
      ...(placeContextStorageEnabled?{place_context:placeContext}:{}),...(writeMapPoint?{map_point:mapPoint}:{}),
      })
      .eq("id", logId)
      .eq("user_id", user.id);
    // Reject stale edits so we only reclaim the photo this update replaced.
    const { data: updatedLog, error } = await (existingLog.photo_path === null
      ? update.is("photo_path", null)
      : update.eq("photo_path", existingLog.photo_path))
      .select("id")
      .maybeSingle();

    if (error || !updatedLog) {
      if (photoPath !== existingLog.photo_path) {
        await cleanupUncommittedActivityPhoto(supabase, user.id, photoPath);
      }
      return activityErrorState("\u8a18\u9332\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002");
    }

    uploadedPhoto = undefined;

    if (photoPath !== existingLog.photo_path) {
      await cleanupUncommittedActivityPhoto(supabase, user.id, existingLog.photo_path);
    }

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/sessions/${sessionId}/activity-logs/${logId}/edit`);
    revalidatePath("/collection");
    revalidatePath("/collection-next");revalidatePath("/");

    return {
      status: "success",
      message: "\u4f53\u9a13\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002",
      fieldErrors: {},
    };
  } catch (error) {
    if (uploadedPhoto) await cleanupUncommittedActivityPhoto(...uploadedPhoto);
    return activityErrorState(
      error instanceof Error
        ? `\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f: ${error.message}`
        : "\u4f53\u9a13\u306e\u66f4\u65b0\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002"
    );
  }
}
