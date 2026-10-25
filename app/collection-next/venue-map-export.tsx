"use client";

import { useEffect, useRef, useState } from "react";
import type { MapArtwork, VenueMapMarker } from "./venue-map-frame";
import {checkGeneratedPng} from '@/lib/png-metadata';
import { createVenueMapImage } from "./venue-map-image";

export function VenueMapExport({ markers, asset, badgeMarkers, title, unavailableReason, memoryStyle=false }: { markers: VenueMapMarker[]; asset?: MapArtwork; badgeMarkers?: boolean; title?: string; unavailableReason?:string;memoryStyle?:boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  async function prepareImage() {
    if (busyRef.current||unavailableReason) return;
    busyRef.current = true; setBusy(true); setMessage("");
    try {
      const source = hostRef.current?.closest("section")?.querySelector<SVGSVGElement>("svg[data-venue-map-source]");
      if (!source) throw new Error("map-unavailable");
      const blob = await createVenueMapImage(source, markers, { asset, badgeMarkers, title, memoryStyle,onPhotosOmitted:count=>setMessage(`${count}か所の写真は取得できず、花で表示しています。`) });
      await checkGeneratedPng(blob);
      const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
      const file = new File([blob], `bloomlog-map-${date}.png`, { type: "image/png" });
      setPreview({ url: URL.createObjectURL(blob), file });
    } catch {
      setMessage("画像を作成できませんでした。通信状態を確認し、もう一度お試しください。");
    } finally {
      busyRef.current = false; setBusy(false);
    }
  }

  return (
    <div ref={hostRef} className="border-t border-emerald-100 bg-white px-5 py-4 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{memoryStyle?"思い出が重なる地図を、一枚の作品に。":"今の制覇マップを、一枚の画像に。"}</p>
        <button type="button" onClick={prepareImage} disabled={busy||Boolean(unavailableReason)}
          className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
          {busy ? "画像を作成中..." : memoryStyle?"思い出マップを画像にする":"制覇マップを画像にする"}
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 text-sm text-slate-600">{unavailableReason??message}</p>
      {preview ? (
        <dialog ref={(dialog) => { if (dialog && !dialog.open) dialog.showModal(); }}
          onCancel={() => setPreview(null)} aria-labelledby="map-export-title"
          className="fixed inset-0 m-auto max-h-[92svh] w-[min(94vw,860px)] overflow-auto rounded-2xl bg-white p-5 shadow-xl backdrop:bg-slate-950/50">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 id="map-export-title" className="text-lg font-semibold text-slate-900">{memoryStyle?"思い出マップの画像":"制覇マップの画像"}</h3>
            <button type="button" onClick={() => setPreview(null)} className="rounded-full border px-4 py-2 text-sm">閉じる</button>
          </div>
          {/* This is a locally generated PNG, not a remotely optimized image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.url} alt="訪問済みの花、パビリオン名と達成数を反映した制覇マップ" className="h-auto w-full rounded-lg border border-slate-200" />
          <div className="sticky bottom-0 mt-4 flex flex-wrap gap-3 bg-white py-3">
            <a href={preview.url} download={preview.file.name}
              className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white">画像を保存</a>
          </div>
          <p className="text-xs leading-6 text-slate-500">PNG画像として保存できます。保存した画像をXなどで共有できます。</p>
          <p data-testid="map-metadata-status" className="text-xs leading-6 text-slate-500">生成PNGを検査：EXIF・XMP・テキスト領域なし。原写真の情報は変更していません。</p>
          <p role="status" aria-live="polite" className="mt-2 text-sm text-slate-600">{message}</p>
        </dialog>
      ) : null}
    </div>
  );
}
