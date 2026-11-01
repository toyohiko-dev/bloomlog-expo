"use client";
import {mapPointStorageEnabled} from '@/lib/map-point-config';
import {validateMapPoint,confirmMapPoint,mapPointDistanceMeters,gpsAccuracyMapRadius,type MapPoint,type MapPointDraft} from '@/lib/memory-map-point';
import {MapPointPicker} from './map-point-picker';
import {prepareActivityPhoto,PhotoPreparationError} from "@/lib/prepare-activity-photo";
import {memoryMapReturnHref} from '@/lib/memory-map-navigation';
import {activityAttemptSignature} from '@/lib/activity-save-attempt';
import {decodePlaceContext,type PlaceContext} from '@/lib/place-context';
import {placeContextStorageEnabled} from '@/lib/place-context-config';


import Link from "next/link";
import { placeRegistry } from "@/lib/place-coordinate-catalog";
import { scopedPavilions, canUsePavilionInEvent } from "@/lib/place-registry";
import { readDraftPhoto, keepDraftPhoto } from "@/lib/activity-photo-cache";
import { PhotoLocationSuggestions, SelectedPhotoPreview, PlaceContextSummary } from "./photo-location-suggestions";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  initialActivityLogFormState,
  type ActivityLogFormState,
} from "@/lib/activity-log-form-state";
import {
  acquisitionMethodOptions,
  activityTypeOptions,
  getActivityTypeMeta,
  normalizeAcquisitionMethod,
  type ActivityType,
} from "@/lib/activity-types";
import { searchPavilions, type PavilionOption } from "@/lib/session-shared";
import {
  createEmptyDraft, readActivityDrafts, writeActivityDraft, removeActivityDraft,
  type ActivityTypeDraft,
} from "@/lib/activity-log-drafts";
import {
  submitActivityLogAction,
  updateActivityLogAction,
} from "@/app/sessions/actions";

function toTimeValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).format(date);
}

function fieldClass(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
    hasError
      ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 bg-white focus:border-sky-500 focus:ring-sky-100"
  }`;
}

const EMPTY_VISIT_SESSIONS: {id:string;visit_date:string;event_id?:string|null}[] = [];

type ActivityLogFormProps = {
  onCancelDraft?:()=>void;
  onSaveComplete?: () => void;
  fixtureAdapter?:{photo:File|null;submit:(data:FormData,mode:"create"|"edit")=>Promise<ActivityLogFormState>;onSaved:(id:string|null,mapScope?:string|null)=>void};
  sessionId: string;
  visitDate?: string;
  visitEventId?: string|null;
  recentPavilionIds?: string[];
  visitSessions?: {id:string;visit_date:string;event_id?:string|null}[];
  draftOwnerId?: string;
  pavilions: PavilionOption[];
  mode?: "create" | "edit";
  logId?: string;
  successRedirectPath?: string;
  returnToMap?:boolean;
  returnMapDate?:string|null;
  photoEntry?:boolean;
  submitLabel?: string;
  cancelHref?: string;
  cancelLabel?: string;
  initialActivityType?: ActivityType;
  initialTitle?: string;
  initialMemo?: string;
  initialOccurredAt?: string | null;
  initialPrice?: number | null;
  initialAcquisitionMethod?: string | null;
  initialPavilionId?: string | null;
  initialPlaceContext?:PlaceContext|null;
  initialPhoto?:File|null;
  initialMapPoint?:MapPoint|null;
  mapPointAvailable?:boolean;
};

export function ActivityLogForm({
  sessionId,
  fixtureAdapter,
  onSaveComplete,
  onCancelDraft,
  visitDate,
  visitEventId = null,
  recentPavilionIds = [],
  visitSessions = EMPTY_VISIT_SESSIONS,
  draftOwnerId,
  pavilions,
  mode = "create",
  logId,
  successRedirectPath,
  returnToMap=false,
  returnMapDate,
  photoEntry=returnToMap,
  submitLabel,
  cancelHref,
  cancelLabel,
  initialActivityType = "pavilion_visit",
  initialTitle = "",
  initialMemo = "",
  initialOccurredAt = null,
  initialPrice = null,
  initialAcquisitionMethod = "purchase",
  initialPavilionId = null,
  initialPlaceContext = null,
  initialPhoto = null,
  initialMapPoint = null,
  mapPointAvailable = mapPointStorageEnabled,
}: ActivityLogFormProps) {
  const router = useRouter();
  const draftSessionKey = mode === "edit" ? `${sessionId}:edit:${logId ?? "unknown"}` : sessionId;
  const [recordingSessionId, setRecordingSessionId] = useState(sessionId);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActivityLogFormState>(
    initialActivityLogFormState,
  );
  const [activityType, setActivityType] =
    useState<ActivityType>(initialActivityType);
  const [title, setTitle] = useState(initialTitle);
  const [memo, setMemo] = useState(initialMemo);
  const [occurredAt, setOccurredAt] = useState(toTimeValue(initialOccurredAt));
  const [price, setPrice] = useState(
    initialPrice === null ? "" : String(initialPrice),
  );
  const [acquisitionMethod, setAcquisitionMethod] = useState<string>(
    normalizeAcquisitionMethod(initialAcquisitionMethod) ?? "",
  );
  const initialSelectedPavilion =
    pavilions.find((pavilion) => pavilion.id === initialPavilionId) ?? null;
  const [pavilionSearch, setPavilionSearch] = useState(
    initialSelectedPavilion?.name ?? (initialActivityType === "pavilion_visit" ? initialTitle : ""),
  );
  const photoPositionIntent=useRef<"suggest"|"chosen"|"omit">(initialMapPoint?"chosen":"suggest");
  const [mapPoint,setMapPoint]=useState<MapPoint|null>(initialMapPoint);
  const [positionSuggestion,setPositionSuggestion]=useState<MapPointDraft|null>(null);
  const [pointPicker,setPointPicker]=useState<MapPointDraft|null|false>(false);
  const [photoOrigin,setPhotoOrigin]=useState<"gallery"|"camera">(initialPhoto?"camera":"gallery");
  const [placeContext,setPlaceContext]=useState<PlaceContext|null>(initialPlaceContext);
  const [selectedPavilionId, updateSelectedPavilionId] = useState(
    initialSelectedPavilion?.id ?? "",
  );
  function setSelectedPavilionId(id:string){updateSelectedPavilionId(id);setPlaceContext(null);}
  const [hasSelectedPhoto, setHasSelectedPhoto] = useState(Boolean(initialPhoto));
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(initialPhoto);
  const [photoNeedsReselect, setPhotoNeedsReselect] = useState(false);
  const [draftReady, setDraftReady] = useState(!draftOwnerId);
  const [draftNotice, setDraftNotice] = useState("");
  const submittingRef = useRef(false);
  const photoSelection=useRef<string|undefined>(initialPhoto?crypto.randomUUID():undefined);
  const saveAttempt=useRef<{id:string;signature:string}|null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const recordingSessionRef = useRef<HTMLSelectElement>(null);
  const deferredPavilionSearch = useDeferredValue(pavilionSearch);
  const selectedDay = visitSessions.find(day=>day.id===recordingSessionId);
  const recordingEventId = selectedDay ? selectedDay.event_id ?? null : visitEventId;
  const availablePavilions = scopedPavilions(pavilions,recordingEventId,placeRegistry);
  const placeCompatible = !selectedPavilionId || canUsePavilionInEvent(placeRegistry,recordingEventId,selectedPavilionId) || (mode==="edit" && selectedPavilionId===initialPavilionId);

  const draftsRef = useRef<Record<ActivityType, ActivityTypeDraft>>({
    pavilion_visit:
      initialActivityType === "pavilion_visit"
        ? {
            ...createEmptyDraft(),
            mapPoint:initialMapPoint,
            title: initialSelectedPavilion?.name ?? initialTitle,
            price: "",
            acquisitionMethod: "",
            pavilionId: initialSelectedPavilion?.id ?? "",
            pavilionSearch: initialSelectedPavilion?.name ?? initialTitle,
          }
        : createEmptyDraft(),
    food:
      initialActivityType === "food"
        ? {
            ...createEmptyDraft(),
            mapPoint:initialMapPoint,
            title: initialTitle,
            price: initialPrice === null ? "" : String(initialPrice),
            acquisitionMethod: "",
            pavilionId: "",
            pavilionSearch: "",
          }
        : createEmptyDraft(),
    pin:
      initialActivityType === "pin"
        ? {
            ...createEmptyDraft(),
            mapPoint:initialMapPoint,
            title: initialTitle,
            price: initialPrice === null ? "" : String(initialPrice),
            acquisitionMethod:
              normalizeAcquisitionMethod(initialAcquisitionMethod) ?? "",
            pavilionId: "",
            pavilionSearch: "",
          }
        : createEmptyDraft(),
    event_participation:
      initialActivityType === "event_participation"
        ? {
            ...createEmptyDraft(),
            mapPoint:initialMapPoint,
            title: initialTitle,
            price: "",
            acquisitionMethod: "",
            pavilionId: "",
            pavilionSearch: "",
          }
        : createEmptyDraft(),
  });

  useEffect(() => {
    if (!draftOwnerId) return;
    try {
      const saved = readActivityDrafts(window.localStorage, draftOwnerId, draftSessionKey);
      if (!saved.restored) { setDraftNotice("下書きはこのブラウザに保存されます。"); setDraftReady(true); return; }
      draftsRef.current = saved.drafts;
      const draft = saved.drafts[saved.activeType];
      // Restore browser-owned state after hydration, before enabling the form.
      if (draft.recordingSessionId === sessionId || visitSessions.some(day=>day.id===draft.recordingSessionId)) setRecordingSessionId(draft.recordingSessionId!);
      setActivityType(saved.activeType);
      setTitle(draft.title);
      setMemo(draft.memo);
      setOccurredAt(draft.occurredAt);
      setPrice(draft.price);
      setAcquisitionMethod(draft.acquisitionMethod);
      setPavilionSearch(draft.pavilionSearch);
      setSelectedPavilionId(draft.pavilionId);
      setPlaceContext(draft.placeContext??null);
      setMapPoint(draft.mapPoint??null);setPhotoOrigin(draft.photoOrigin??"gallery");
      photoSelection.current=draft.photoSelectionId;
      saveAttempt.current=draft.saveAttemptId&&draft.saveAttemptSignature?{id:draft.saveAttemptId,signature:draft.saveAttemptSignature}:null;
      const retainedPhoto = draft.photoNeedsReselect ? readDraftPhoto(draftOwnerId, draftSessionKey) : null;
      setSelectedPhoto(retainedPhoto);
      setHasSelectedPhoto(Boolean(retainedPhoto));
      setPhotoNeedsReselect(draft.photoNeedsReselect && !retainedPhoto);
      setDraftNotice(saved.restored
        ? "下書きを復元しました。このブラウザだけに保存されます。"
        : "下書きはこのブラウザに保存されます。");
    } catch {
      setDraftNotice("下書きを保存できません。画面を閉じると入力内容が失われます。");
    }
    setDraftReady(true);
  }, [draftOwnerId, draftSessionKey, sessionId, visitSessions]);

  const normalizedInitialMethod =
    normalizeAcquisitionMethod(initialAcquisitionMethod) ?? "";
  const normalizedInitialTime = toTimeValue(initialOccurredAt);
  const normalizedInitialPrice =
    initialPrice === null ? "" : String(initialPrice);
  const normalizedInitialPavilionId = initialSelectedPavilion?.id ?? "";
  const activityTypeMeta = getActivityTypeMeta(activityType);
  const selectedPavilion =
    pavilions.find((pavilion) => pavilion.id === selectedPavilionId) ?? null;
  const showPrice = activityType === "food" || activityType === "pin";
  const showAcquisitionMethod = activityType === "pin";
  const showPavilionPicker = activityType === "pavilion_visit";
  const showPhotoInput = true;
  const notesLength = memo.length;
  const filteredPavilions = deferredPavilionSearch.trim() ? searchPavilions(availablePavilions, deferredPavilionSearch) : availablePavilions;
  const hasPavilionSearch = deferredPavilionSearch.trim().length > 0;

  const isDirty =
    mode === "create"
      ? Boolean(
          title ||
            memo ||
            occurredAt ||
            price ||
            activityType !== "pavilion_visit" ||
            selectedPavilionId ||
            hasSelectedPhoto,
        )
      : activityType !== initialActivityType ||
        selectedPavilionId !== normalizedInitialPavilionId ||
        title !== initialTitle ||
        memo !== initialMemo ||
        occurredAt !== normalizedInitialTime ||
        price !== normalizedInitialPrice ||
        acquisitionMethod !== normalizedInitialMethod ||
        hasSelectedPhoto || JSON.stringify(mapPoint)!==JSON.stringify(initialMapPoint);

  function clearFieldState(field: keyof ActivityLogFormState["fieldErrors"]) {
    setState((current) => ({
      ...current,
      status: "idle",
      message: "",
      fieldErrors: {
        ...current.fieldErrors,
        [field]: undefined,
      },
    }));
  }

  function clearTypeSpecificFieldStates() {
    setState((current) => ({
      ...current,
      status: "idle",
      message: "",
      fieldErrors: {
        ...current.fieldErrors,
        pavilionId: undefined,
        title: undefined,
        price: undefined,
        acquisitionMethod: undefined,
        photo: undefined,
      },
    }));
  }

  function buildCurrentDraft(): ActivityTypeDraft {
    return {
      recordingSessionId,
      photoSelectionId:photoSelection.current,
      saveAttemptId:saveAttempt.current?.id,
      saveAttemptSignature:saveAttempt.current?.signature,
      placeContext,
      mapPoint,photoOrigin,
      memo,
      occurredAt,
      photo: selectedPhoto,
      photoNeedsReselect,
      title,
      price,
      acquisitionMethod,
      pavilionId: selectedPavilionId,
      pavilionSearch,
    };
  }

  function persistDraft(patch: Partial<ActivityTypeDraft> = {}, type = activityType) {
    if (!draftOwnerId || !draftReady) return;
    try {
      writeActivityDraft(window.localStorage, draftOwnerId, draftSessionKey, type,
        { ...buildCurrentDraft(), ...patch });
      setDraftNotice("下書きをこのブラウザに保存しました。");
    } catch {
      setDraftNotice("下書きを保存できません。画面を閉じると入力内容が失われます。");
    }
  }

  function handleActivityTypeChange(nextActivityType: ActivityType) {
    if (!draftReady || submittingRef.current || pending || nextActivityType === activityType) {
      return;
    }

    draftsRef.current[activityType] = buildCurrentDraft();
    const nextDraft = draftsRef.current[nextActivityType] ?? createEmptyDraft();

    setActivityType(nextActivityType);
    setTitle(nextDraft.title);
    setPrice(nextDraft.price);
    setAcquisitionMethod(nextDraft.acquisitionMethod);
    setPavilionSearch(nextDraft.pavilionSearch);
    setSelectedPavilionId(nextDraft.pavilionId);
    setPlaceContext(nextDraft.placeContext??null);
    setMapPoint(nextDraft.mapPoint??null);
    photoSelection.current=nextDraft.photoSelectionId;
    saveAttempt.current=nextDraft.saveAttemptId&&nextDraft.saveAttemptSignature?{id:nextDraft.saveAttemptId,signature:nextDraft.saveAttemptSignature}:null;
    if (mode === "create") {
      setMemo(nextDraft.memo);
      setOccurredAt(nextDraft.occurredAt);
      // The chosen photo belongs to this recording attempt, not to a category.
      persistDraft({ ...nextDraft, photo: selectedPhoto, photoNeedsReselect, recordingSessionId }, nextActivityType);
      setState(initialActivityLogFormState);
      return;
    }
    clearFieldState("activityType");
    clearTypeSpecificFieldStates();
  }

  function resetForm(savedActivityType: ActivityType) {
    saveAttempt.current=null;
    if(draftOwnerId)keepDraftPhoto(draftOwnerId,draftSessionKey,null);
    draftsRef.current[savedActivityType] = { ...createEmptyDraft(), pavilionId: selectedPavilionId, pavilionSearch: selectedPavilion?.name ?? "" };
    setTitle("");
    setMemo("");
    setOccurredAt("");
    setPrice("");
    setAcquisitionMethod("");
    setPavilionSearch(selectedPavilion?.name ?? "");
    setSelectedPavilionId(selectedPavilionId);
    setMapPoint(null);
    setHasSelectedPhoto(false);
    setSelectedPhoto(null);
    setPhotoNeedsReselect(false);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
    setState(initialActivityLogFormState);
    if (draftOwnerId) {
      try {
        removeActivityDraft(window.localStorage, draftOwnerId, draftSessionKey, savedActivityType);
        setDraftNotice("保存しました。選択中の場所は次の記録にも使えます。");
      } catch {
        setDraftNotice("思い出は保存されましたが、下書きを消去できませんでした。再読み込み後の重複保存にご注意ください。");
      }
    }
  }

  function choosePhoto(file:File,origin:"gallery"|"camera"="gallery") {
    setPositionSuggestion(null);const nextPoint=mapPoint?.source==="manual"?mapPoint:null;setMapPoint(nextPoint);photoPositionIntent.current=nextPoint?"chosen":"suggest";setPhotoOrigin(origin);
    photoSelection.current=crypto.randomUUID();
    if(draftOwnerId)keepDraftPhoto(draftOwnerId,draftSessionKey,file);
    setSelectedPhoto(file); setHasSelectedPhoto(true); setPhotoNeedsReselect(false);
    persistDraft({photo:file,photoNeedsReselect:false,mapPoint:nextPoint,photoOrigin:origin}); clearFieldState('photo');
  }
  function removeSelectedPhoto() {
    setPositionSuggestion(null);const nextPoint=mapPoint?.source==="manual"?mapPoint:null;setMapPoint(nextPoint);photoPositionIntent.current=nextPoint?"chosen":"omit";setPhotoOrigin("gallery");
    photoSelection.current=crypto.randomUUID();
    if(draftOwnerId)keepDraftPhoto(draftOwnerId,draftSessionKey,null);
    setSelectedPhoto(null);setHasSelectedPhoto(false);setPhotoNeedsReselect(false);
    if(photoInputRef.current)photoInputRef.current.value='';
    persistDraft({photo:null,photoNeedsReselect:false,mapPoint:nextPoint,photoOrigin:"gallery"});clearFieldState('photo');
  }
  function choosePlace(id:string) {
    const place=availablePavilions.find(item=>item.id===id);
    setSelectedPavilionId(place?.id??'');setPavilionSearch(place?.name??'');
    const nextTitle=activityType==='pavilion_visit' ? place?.name??'' : title;
    if(activityType==='pavilion_visit')setTitle(nextTitle);
    persistDraft({placeContext:null,pavilionId:place?.id??'',pavilionSearch:place?.name??'',title:nextTitle});clearFieldState('pavilionId');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftReady || submittingRef.current || pending) {
      return;
    }
    if(!recordingSessionId){setState({status:"error",message:"来場日を選んでください。",fieldErrors:{sessionId:"来場日を選んでください。"}});recordingSessionRef.current?.focus();recordingSessionRef.current?.scrollIntoView({block:"center"});return;}
    if(photoNeedsReselect&&!selectedPhoto){setState({status:'error',message:'写真を選び直すか、写真なしに変更してください。ほかの入力した内容は残っています。',fieldErrors:{photo:'写真の再選択が必要です。'}});return;}
    if(!placeCompatible){setState({status:"error",message:"この来場日の施設対応が未確認です。場所を選び直してください。",fieldErrors:{pavilionId:"イベントに対応する施設を選んでください。"}});return;}
    if(mapPoint){const checked=validateMapPoint(mapPoint,{eventId:recordingEventId,pavilionId:selectedPavilionId||null,activityType});if(!mapPointAvailable||!checked.ok){setState({status:'error',message:'地図の位置を確認するか、あとで指定に変更してください。入力した内容は残っています。',fieldErrors:{pavilionId:'地図位置がこの記録に対応していません。'}});return;}}
    if(mode==='create'){
      const signature=activityAttemptSignature(JSON.stringify({recordingSessionId,activityType,title,memo,occurredAt,price,acquisitionMethod,selectedPavilionId,placeContext,mapPoint,hasPhoto:Boolean(selectedPhoto||photoNeedsReselect),photoSelection:photoSelection.current}));
      if(!saveAttempt.current)saveAttempt.current={id:crypto.randomUUID(),signature};
    }
    persistDraft();
    const formData = new FormData(event.currentTarget);
    if(photoEntry&&!title.trim())formData.set("title","写真の思い出");
    if(mapPointAvailable)formData.set("mapPoint",mapPoint?JSON.stringify(mapPoint):"");
    if(placeContextStorageEnabled)formData.set("placeContext",placeContext?JSON.stringify(placeContext):"");
    if(mode==='create'&&saveAttempt.current){formData.set('saveAttemptId',saveAttempt.current.id);const signature=activityAttemptSignature(JSON.stringify({recordingSessionId,activityType,title,memo,occurredAt,price,acquisitionMethod,selectedPavilionId,placeContext,mapPoint,hasPhoto:Boolean(selectedPhoto||photoNeedsReselect),photoSelection:photoSelection.current}));formData.set('saveAttemptChanged',String(signature!==saveAttempt.current.signature));}
    const submittedActivityType = activityType;
    const submittedRecordId=mode==='edit'?logId??null:saveAttempt.current?.id??null;
    formData.delete("photo");

    submittingRef.current = true;

    startTransition(async () => {
      try {
        if(selectedPhoto){try{formData.set("photo",await prepareActivityPhoto(selectedPhoto));}catch{throw new PhotoPreparationError();}}
        const result =
          fixtureAdapter?await fixtureAdapter.submit(formData,mode):mode === "edit"
            ? await updateActivityLogAction(formData)
            : await submitActivityLogAction(formData);

        setState(result);

        if (result.status !== "success") {
          return;
        }

        if (mode === "create") {
          resetForm(submittedActivityType);
          setState(result);
        }

        if(mode==='edit'&&draftOwnerId){keepDraftPhoto(draftOwnerId,draftSessionKey,null);try{for(const option of activityTypeOptions)removeActivityDraft(window.localStorage,draftOwnerId,draftSessionKey,option.value);}catch{ /* Saved record is authoritative; draft cleanup failure does not undo it. */ }}
        onSaveComplete?.();
        if(fixtureAdapter){fixtureAdapter.onSaved(submittedRecordId,returnMapDate);return;}
        if(returnToMap){router.push(memoryMapReturnHref(recordingEventId,selectedPavilionId||null,returnMapDate===undefined?selectedDay?.visit_date??visitDate??null:returnMapDate,submittedRecordId,Boolean(mapPoint)));router.refresh();return;}
        if (successRedirectPath) {
          router.push(recordingSessionId !== sessionId ? `/sessions/${recordingSessionId}` : successRedirectPath);
          router.refresh();
          return;
        }

        if (mode === "edit") {
          if(draftOwnerId){keepDraftPhoto(draftOwnerId,draftSessionKey,null);try{for(const option of activityTypeOptions)removeActivityDraft(window.localStorage,draftOwnerId,draftSessionKey,option.value);}catch{ /* The record was saved; draft cleanup must not report a failed save. */ }}
          router.push(`/sessions/${sessionId}`);
          router.refresh();
          return;
        }

        router.refresh();
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof PhotoPreparationError ? error.message : "保存できませんでした。入力内容を確認して、もう一度お試しください。",
          fieldErrors: error instanceof PhotoPreparationError ? {photo:"写真を変換できません。写真を選び直すか、写真なしで保存してください。"} : {},
        });
      } finally {
        submittingRef.current = false;
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 text-slate-900"
      encType="multipart/form-data"
    >
      {pointPicker!==false?<MapPointPicker initial={pointPicker} onCancel={()=>setPointPicker(false)} onConfirm={point=>{if(!mapPointAvailable)return;photoPositionIntent.current="chosen";setMapPoint(point);setPointPicker(false);setPositionSuggestion(null);persistDraft({mapPoint:point});}} />:null}
      {fixtureAdapter?<div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">お試し画面です。実際の記録は増えません。<button type="button" disabled={!fixtureAdapter.photo||pending} onClick={()=>{if(fixtureAdapter.photo)choosePhoto(fixtureAdapter.photo);}} className="mt-2 block min-h-11 rounded-full border bg-white px-4">サンプル写真を使う</button></div>:null}
      <input type="hidden" name="sessionId" value={recordingSessionId} />
      {mode === "edit" && logId ? (
        <input type="hidden" name="logId" value={logId} />
      ) : null}
      <input type="hidden" name="pavilionId" value={selectedPavilionId} />

      {state.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
          {state.recoveryHref?<Link href={state.recoveryHref} className="mt-2 block underline">保存済みの記録を開いて確認・編集</Link>:null}
        </div>
      ) : null}

      {draftOwnerId ? (
        <p role="status" aria-live="polite" className="text-sm text-slate-500">
          {!draftReady ? "下書きを確認しています..." : pending ? "思い出を保存しています..." : draftNotice}
        </p>
      ) : null}
      <div aria-label="保存する日と場所" className={`${photoEntry?"hidden":"sticky top-0 z-30 flex"} flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d9dfd0] bg-[#fffcf5]/95 p-3 text-sm shadow-sm backdrop-blur`}>
        <div><p className="text-xs text-[#496250]">{selectedDay?.visit_date??visitDate??'この来場日'} · {activityTypeMeta.label}</p><p className="font-semibold text-[#234b3b]">{mapPoint?"地図上の写真の位置を指定済み":selectedPavilion?.name??(showPavilionPicker?'訪問先を選んでください':'場所はあとで選べます')}</p></div>
        <a onClick={()=>{const panel=document.getElementById("photo-location-options");if(panel instanceof HTMLDetailsElement)panel.open=true;}} href="#photo-location-options" className="inline-flex min-h-11 items-center rounded-full border border-[#a7b6a0] px-3 font-semibold text-[#234b3b]">{selectedPavilion?'名前を変更':'名前から選ぶ'}</a>
      </div>
      <fieldset disabled={pending || !draftReady} className={pending ? "opacity-70" : undefined}>
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50/80">
          <div className="space-y-4 border-b border-slate-200 bg-[#fffcf5] px-5 py-5">
            <p className="text-sm font-semibold">{photoEntry?"写真":"写真から記録を始める（省略可）"}</p>
            {mode==="edit"?<p className="text-xs text-slate-500">保存済みの写真は、新しい写真を選んで保存するまで変更されません。</p>:null}
            {showPhotoInput ? (
              <div>
                <details open={!selectedPhoto||photoNeedsReselect}><summary className="mb-3 cursor-pointer text-sm font-semibold">{selectedPhoto?"写真を差し替える":"写真を撮る・選ぶ"}</summary>
                <label
                  htmlFor="photo"
                  className={photoEntry?"inline-flex min-h-11 cursor-pointer items-center rounded-full border bg-white px-4 py-2 text-sm":"mb-2 block text-sm font-medium text-slate-700"}
                >
                  {photoEntry?"写真を選ぶ":"写真を撮る・選ぶ（任意）"}
                </label>
                <input
                  ref={(input) => {
                    photoInputRef.current = input;
                    if (input) {
                      // 種類を戻したときも、表示中のファイルと送信する File を一致させる。
                      const files = new DataTransfer();
                      if (selectedPhoto) files.items.add(selectedPhoto);
                      input.files = files.files;
                    }
                  }}
                  id="photo"
                  aria-label="写真を選ぶ"
                  disabled={Boolean(fixtureAdapter)}
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => { const file=event.target.files?.[0]; if(file) choosePhoto(file); }}
                  className={photoEntry?"sr-only":fieldClass(Boolean(state.fieldErrors.photo))}
                />
                <label className="ml-3 mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-full border bg-white px-4 py-2 text-sm">撮る
                  <input type="file" disabled={Boolean(fixtureAdapter)} accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" aria-label="カメラで撮影" onChange={event=>{const file=event.target.files?.[0];if(file)choosePhoto(file,"camera");event.target.value='';}} />
                </label>
                </details>
                <SelectedPhotoPreview photo={selectedPhoto} />
                {selectedPhoto||photoNeedsReselect?<button type="button" onClick={removeSelectedPhoto} className="ml-3 rounded-full border px-4 py-2 text-sm">選択した写真を取り消す</button>:null}
                {photoNeedsReselect ? (
                  <p className="mt-2 text-sm text-amber-700">
                    写真はもう一度選択してください。写真本体は下書きに保存されません。
                  </p>
                ) : null}
                {state.fieldErrors.photo ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {state.fieldErrors.photo}
                  </p>
                ) : null}
              </div>
            ) : null}


            <label className="block text-sm font-medium">来場日
              {mode==='create'&&visitSessions.length>0 ? <select ref={recordingSessionRef} id="recording-session" aria-label="記録する来場日" aria-invalid={Boolean(state.fieldErrors.sessionId)} aria-describedby={state.fieldErrors.sessionId?"recording-session-error":undefined} value={recordingSessionId} onChange={event=>{setRecordingSessionId(event.target.value);persistDraft({recordingSessionId:event.target.value});clearFieldState("sessionId");}} className={`mt-2 ${fieldClass(Boolean(state.fieldErrors.sessionId))}`}>{!recordingSessionId?<option value="" disabled>来場日を選んでください</option>:null}{visitSessions.map(day=><option key={day.id} value={day.id}>{day.visit_date}</option>)}</select> : <span className="ml-3">{visitDate??'この来場日'}</span>}
            </label>
            {state.fieldErrors.sessionId?<p id="recording-session-error" role="alert" className="text-sm font-medium text-rose-700">{state.fieldErrors.sessionId}</p>:null}
            {photoEntry?<p className="text-xs text-slate-600">写真を撮った日を選んでください。</p>:null}
          </div>
          <div className="space-y-5 px-5 py-5">
            {mapPointAvailable&&recordingEventId==='e60f2360-8147-4112-969a-00954596ceb6'?<section aria-label="撮影地点" className="overflow-hidden rounded-2xl border border-[#c7d4bd] bg-[#fffcf5]">
              {mapPoint?<button type="button" disabled={pending} aria-label="撮影地点を変更" onClick={()=>setPointPicker({...mapPoint,confirmed:false})} className="flex min-h-32 w-full items-center gap-4 p-3 text-left"><svg viewBox="0 0 100 125" role="img" aria-label="この写真を残す地点" className="h-32 w-28 shrink-0 rounded-xl bg-[#f6f0df]"><image href="/art/green-expo-places-v1.svg" width="100" height="125"/>{gpsAccuracyMapRadius(mapPoint)!==null?<circle cx={mapPoint.x*100} cy={mapPoint.y*125} r={gpsAccuracyMapRadius(mapPoint)!} fill="#4198cc" fillOpacity=".18" stroke="#4198cc" strokeWidth=".4"/>:null}<circle cx={mapPoint.x*100} cy={mapPoint.y*125} r="3" fill="#a94035" stroke="white" strokeWidth="1"/></svg><span className="font-semibold text-[#234b3b]">地図で変更</span></button>:<button type="button" disabled={pending} onClick={()=>setPointPicker(null)} className="min-h-12 w-full px-4 text-left font-semibold text-[#234b3b]">撮ったところを地図で選ぶ</button>}
              {mapPoint?<button type="button" disabled={pending} onClick={()=>{photoPositionIntent.current="omit";setMapPoint(null);setPositionSuggestion(null);persistDraft({mapPoint:null});}} className="m-3 mt-0 min-h-11 rounded-full border px-4 text-sm">地図では選ばない</button>:null}
              {positionSuggestion?<div className="border-t p-3"><p className="text-sm">写真の撮影地点は、選んだ地点から離れています。</p><button type="button" disabled={pending} onClick={()=>setPointPicker(positionSuggestion)} className="mt-2 min-h-11 rounded-full border px-4 text-sm">写真の撮影地点を確認</button></div>:null}
            </section>:null}
            {mapPointAvailable&&recordingEventId==='e60f2360-8147-4112-969a-00954596ceb6'?<details><summary className="cursor-pointer rounded-xl border bg-white p-3 text-sm font-semibold">GPSから選ぶ</summary><PhotoLocationSuggestions mode="point" onPhotoPoint={draft=>{if(submittingRef.current||pending||photoPositionIntent.current==="omit"||!mapPointAvailable||recordingEventId!=='e60f2360-8147-4112-969a-00954596ceb6')return;if(mapPoint){if(mapPointDistanceMeters(mapPoint,draft)>50)setPositionSuggestion(draft);return;}const value=confirmMapPoint(draft,true);if(value){setMapPoint(value);persistDraft({mapPoint:value});}}} deviceLocationEnabled={!fixtureAdapter} photoOrigin={selectedPhoto?photoOrigin:mode==="edit"?"gallery":"none"} onPointSuggest={mapPointAvailable?draft=>setPointPicker(draft):undefined} photo={selectedPhoto} pavilions={availablePavilions} eventId={recordingEventId} visitDate={selectedDay?.visit_date??visitDate??''} onSelect={()=>{}} disabled={pending}/></details>:null}
            {selectedPavilion?<div className="flex items-center justify-between gap-3 rounded-xl bg-[#edf3e7] p-3"><p className="text-sm font-semibold text-[#234b3b]">{selectedPavilion.name}の思い出</p><a href="#photo-location-options" onClick={()=>{const panel=document.getElementById('photo-location-options');if(panel instanceof HTMLDetailsElement){panel.open=true;const parent=panel.parentElement?.closest('details');if(parent)parent.open=true;}}} className="min-h-11 rounded-full border px-3 py-2 text-sm">変更</a></div>:null}
            <details open={!photoEntry||Boolean(state.fieldErrors.pavilionId||state.fieldErrors.title||state.fieldErrors.activityType||state.fieldErrors.memo||state.fieldErrors.price||state.fieldErrors.occurredAt||state.fieldErrors.acquisitionMethod)}><summary className="cursor-pointer rounded-xl border bg-white p-3 text-sm font-semibold">詳しく残す</summary><div className="mt-3 space-y-4">
            <details id="photo-location-options" open={!photoEntry||showPavilionPicker||Boolean(state.fieldErrors.pavilionId)}><summary className="cursor-pointer rounded-xl border bg-white p-3 text-sm font-semibold">{selectedPavilion?.name??(showPavilionPicker?"訪問先を選ぶ":"パビリオンやお店ごとにまとめる")}</summary>
            <div className="flex flex-wrap gap-2" aria-label="最近の場所">
              {[...new Set([selectedPavilionId,...recentPavilionIds,...Object.values(draftsRef.current).map(draft=>draft.pavilionId)].filter(Boolean))].slice(0,5).map(id=>{const place=pavilions.find(p=>p.id===id);return place?<button type="button" key={id} onClick={()=>choosePlace(id)} className="rounded-full border border-[#c6d3c4] bg-[#f2f6ee] px-4 py-2 text-sm">{place.name}</button>:null;})}
            </div>
            <PhotoLocationSuggestions mode="subject" deviceLocationEnabled={!fixtureAdapter} photoOrigin={selectedPhoto?photoOrigin:mode==="edit"?"gallery":"none"} photo={selectedPhoto} pavilions={availablePavilions} eventId={recordingEventId} visitDate={selectedDay?.visit_date??visitDate??''} onSelect={choosePlace} onContextSelect={(id,context)=>{const parsed=decodePlaceContext(context);if(!parsed.ok)return;const place=availablePavilions.find(p=>p.id===id);if(!place)return;choosePlace(id);setPlaceContext(parsed.value);persistDraft({pavilionId:id,pavilionSearch:place.name,title:activityType==='pavilion_visit'?place.name:title,placeContext:parsed.value});}} disabled={pending} />
            {placeContext?<div className="rounded-xl border p-3"><PlaceContextSummary context={placeContext}/><button type="button" disabled={pending} onClick={()=>{setPlaceContext(null);persistDraft({placeContext:null});}} className="mt-2 text-sm underline">場所の詳細を取り消す</button></div>:null}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <label htmlFor="pavilion-search" className="block text-sm font-medium">名前から選ぶ{showPavilionPicker?'（訪問は必須）':'（任意）'}</label>
              <p className="text-sm text-[#315e4b]">{selectedPavilion?'選択中: '+selectedPavilion.name:showPavilionPicker?'訪れたパビリオンを選んでください。':'選ばずに保存できます。'}{!placeCompatible?" このイベントでは選べない場所です。別の場所を選んでください。":null}</p>
              <input id="pavilion-search" type="text" value={pavilionSearch} placeholder="名前で探す" onChange={event=>{setPavilionSearch(event.target.value);persistDraft({pavilionSearch:event.target.value});}} className={fieldClass(false)} />
              <label htmlFor="related-place" className="sr-only">名前の一覧</label>
              <select id="related-place" value={selectedPavilionId} className={fieldClass(Boolean(state.fieldErrors.pavilionId))} onChange={event=>choosePlace(event.target.value)}>
                <option value="">選ばない</option>
                {selectedPavilion&&!filteredPavilions.some(p=>p.id===selectedPavilion.id)?<option value={selectedPavilion.id}>{selectedPavilion.name}</option>:null}
                {filteredPavilions.map(place=><option key={place.id} value={place.id}>{place.name}</option>)}
              </select>
              {hasPavilionSearch&&filteredPavilions.length===0?<p className="text-xs text-slate-500">一致する場所はありません。名前を消すと一覧に戻れます。</p>:null}
              {state.fieldErrors.pavilionId?<p className="text-sm text-rose-600">{state.fieldErrors.pavilionId}</p>:null}
              {!showPavilionPicker&&selectedPavilion?<button type="button" disabled={pending} onClick={()=>choosePlace('')} className="min-h-11 rounded-full border px-4 text-sm font-semibold">選択を外す</button>:null}
              {showPavilionPicker?<p className="text-xs text-slate-500">訪問の記録には場所が必要です。場所を後で決める場合は、フード・グッズ・イベントで記録してください。</p>:null}
            </div>
            </details>
            <details open={!photoEntry||Boolean(state.fieldErrors.title)}><summary className="cursor-pointer rounded-xl border bg-white p-3 text-sm font-semibold">名前を付ける</summary>
            {showPavilionPicker ? <input type="hidden" name="title" value={title} /> : (
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {photoEntry&&activityType==='event_participation'?"写真の名前":activityTypeMeta.titleLabel}
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required={!photoEntry}
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    persistDraft({ title: event.target.value });
                    clearFieldState("title");
                  }}
                  placeholder={activityTypeMeta.titlePlaceholder}
                  className={fieldClass(Boolean(state.fieldErrors.title))}
                />
                {photoEntry?<p className="mt-2 text-xs text-slate-600">あとで写真を探すための短い名前です。そのままでも保存できます。</p>:null}
                {state.fieldErrors.title ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {state.fieldErrors.title}
                  </p>
                ) : null}
              </div>
            )}

            </details>
            <details open={!photoEntry||Boolean(state.fieldErrors.occurredAt||state.fieldErrors.price||state.fieldErrors.acquisitionMethod||state.fieldErrors.memo)}><summary className="cursor-pointer rounded-xl border bg-white p-3 text-sm font-semibold">メモを書く</summary>
            <div>
              <label
                htmlFor="occurredAt"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                時刻
              </label>
              <input
                id="occurredAt"
                name="occurredAt"
                type="time"
                value={occurredAt}
                onChange={(event) => {
                  setOccurredAt(event.target.value);
                  persistDraft({ occurredAt: event.target.value });
                  clearFieldState("occurredAt");
                }}
                className={fieldClass(Boolean(state.fieldErrors.occurredAt))}
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                時間順に並べたいときだけ入力してください。
              </p>
              {state.fieldErrors.occurredAt ? (
                <p className="mt-2 text-sm text-rose-600">
                  {state.fieldErrors.occurredAt}
                </p>
              ) : null}
            </div>

            {showPrice ? (
              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  価格
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(event) => {
                    setPrice(event.target.value);
                    persistDraft({ price: event.target.value });
                    clearFieldState("price");
                  }}
                  placeholder="例: 1200"
                  className={fieldClass(Boolean(state.fieldErrors.price))}
                />
                {state.fieldErrors.price ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {state.fieldErrors.price}
                  </p>
                ) : null}
              </div>
            ) : null}

            {showAcquisitionMethod ? (
              <div>
                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-slate-700">
                    入手方法
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {acquisitionMethodOptions.map((option) => (
                      <label key={option.value} className="block">
                        <input
                          type="radio"
                          name="acquisitionMethod"
                          value={option.value}
                          checked={acquisitionMethod === option.value}
                          onChange={() => {
                            setAcquisitionMethod(option.value);
                            persistDraft({ acquisitionMethod: option.value });
                            clearFieldState("acquisitionMethod");
                          }}
                          className="peer sr-only"
                        />
                        <span className="flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-700 transition peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {state.fieldErrors.acquisitionMethod ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {state.fieldErrors.acquisitionMethod}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="memo"
                  className="block text-sm font-medium text-slate-700"
                >
                  メモ
                </label>
                <span className="text-xs text-slate-400">{notesLength}/1000</span>
              </div>
              <textarea
                id="memo"
                name="memo"
                rows={5}
                value={memo}
                onChange={(event) => {
                  setMemo(event.target.value);
                  persistDraft({ memo: event.target.value });
                  clearFieldState("memo");
                }}
                maxLength={1000}
                placeholder="あとで見返したいことを記録できます。"
                className={fieldClass(Boolean(state.fieldErrors.memo))}
              />
              <p className="mt-2 text-xs text-slate-500">
                メモは1000文字まで入力できます。
              </p>
              {state.fieldErrors.memo ? (
                <p className="mt-2 text-sm text-rose-600">
                  {state.fieldErrors.memo}
                </p>
              ) : null}
            </div>
            </details>
          <details open={!photoEntry||Boolean(state.fieldErrors.activityType)} className="border-b border-slate-200 bg-white/80 px-5 py-5"><summary className="cursor-pointer text-sm font-semibold">記録の種類</summary>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">思い出の種類</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  まず種類を選ぶ
                </h3>
              </div>
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${activityTypeMeta.badgeClassName}`}
              >
                {activityTypeMeta.label}
              </span>
            </div>

            <fieldset className="mt-5">
              <legend className="sr-only">思い出の種類</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {activityTypeOptions.map((option) => {
                  const active = activityType === option.value;

                  return (
                    <label key={option.value} className="block">
                      <input
                        type="radio"
                        name="activityType"
                        value={option.value}
                        checked={active}
                        onChange={() => handleActivityTypeChange(option.value)}
                        className="peer sr-only"
                      />
                      <span
                        className={`flex h-full min-h-20 flex-col items-start justify-between rounded-3xl border px-4 py-4 text-left transition ${
                          active
                            ? option.activeButtonClassName
                            : `${option.buttonClassName} hover:brightness-[0.98]`
                        }`}
                      >
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span className="text-xs leading-5 text-current/80">
                          {option.value === "pavilion_visit"
                            ? "訪れた場所を記録"
                            : option.value === "food"
                              ? "食べたものを記録"
                              : option.value === "pin"
                                ? "手に入れたピンを記録"
                                : "参加したイベントを記録"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {state.fieldErrors.activityType ? (
              <p className="mt-2 text-sm text-rose-600">
                {state.fieldErrors.activityType}
              </p>
            ) : null}
          </details>

            </div></details>
          </div>
        </section>
      </fieldset>

      <div className="sticky bottom-2 z-20 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={!draftReady || pending || (mode === "edit" && !isDirty)}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600"
        >
          {pending
            ? "保存中..."
            : submitLabel ?? (photoEntry?"保存する":mode === "edit" ? "保存する" : "記録する")}
        </button>
        {mode === "create" && !photoEntry ? (
          <span className="text-sm text-slate-500">
            {returnToMap?"保存すると、地図に戻って写真を見られます。":"保存すると、この来場日のタイムラインに戻ります。"}
          </span>
        ) : null}
        {onCancelDraft?<button type="button" disabled={pending} onClick={onCancelDraft} className="min-h-11 rounded-full border border-slate-300 px-5 py-3 text-sm">この写真をやめる</button>:null}
        {cancelHref ? (
          <Link
            href={cancelHref}
            onClick={()=>persistDraft()}
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            {cancelLabel ?? "キャンセル"}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
