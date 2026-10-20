import type { VenueMapMarker } from "./venue-map-frame";
import { VENUE_MAP_ASSET } from "./venue-map-config";

const WIDTH = 1800;
const MAP_X = 44;
const MAP_Y = 166;
const MAP_WIDTH = WIDTH - MAP_X * 2;
const MAP_HEIGHT = MAP_WIDTH * VENUE_MAP_ASSET.height / VENUE_MAP_ASSET.width;
const FONT = '"Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif';

export function getMapImageSummary(markers: VenueMapMarker[]) {
  const unique = [...new Map(markers.map((marker) => [marker.id, marker])).values()];
  const visited = unique.filter((marker) => marker.visited);
  return {
    markers: unique,
    visited,
    total: unique.length,
    percentage: unique.length ? Math.round(visited.length / unique.length * 100) : 0,
  };
}

export function getMapImagePositions(markers: VenueMapMarker[]) {
  const positions = markers.map((marker) => {
    const x = MAP_X + marker.x / VENUE_MAP_ASSET.width * MAP_WIDTH;
    const y = MAP_Y + marker.y / VENUE_MAP_ASSET.height * MAP_HEIGHT;
    return { marker, x, y, anchorX: x, anchorY: y, radius: marker.visited ? 35 : 9 };
  });
  // Only the exported symbols move. Leader lines retain their original map
  // anchors, while closely spaced visits can each keep a readable flower.
  for (let pass = 0; pass < 24; pass++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i], b = positions[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const minimum = a.radius + b.radius + 6;
        if (distance >= minimum) continue;
        const ux = distance ? dx / distance : 1;
        const uy = distance ? dy / distance : 0;
        const shift = (minimum - distance) / 2;
        a.x -= ux * shift; a.y -= uy * shift;
        b.x += ux * shift; b.y += uy * shift;
      }
    }
    for (const point of positions) {
      point.x = Math.max(MAP_X + point.radius, Math.min(MAP_X + MAP_WIDTH - point.radius, point.x));
      point.y = Math.max(MAP_Y + point.radius, Math.min(MAP_Y + MAP_HEIGHT - point.radius, point.y));
    }
  }
  return positions;
}

function imageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => reject(new Error("image-timeout")), 15000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error("image-load")); };
    image.src = url;
  });
}

function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("image-read"));
    reader.readAsDataURL(blob);
  });
}

function fittedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number) {
  let result = text;
  while (result.length > 1 && ctx.measureText(result).width > width) {
    result = Array.from(result).slice(0, -2).join("") + "…";
  }
  ctx.fillText(result, x, y);
}

function drawFlower(ctx: CanvasRenderingContext2D, marker: VenueMapMarker, number: number, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  if (!marker.visited) {
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#94a3b8"; ctx.stroke();
    ctx.restore(); return;
  }
  ctx.scale(0.74, 0.74);
  ctx.rotate(marker.rotation * Math.PI / 180);
  ctx.shadowColor = "#33415530"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  for (let petal = 0; petal < 8; petal++) {
    ctx.save(); ctx.rotate(petal * Math.PI / 4);
    const gradient = ctx.createLinearGradient(0, -46, 0, 0);
    gradient.addColorStop(0, "#ffffff"); gradient.addColorStop(0.55, marker.bloom);
    ctx.fillStyle = gradient; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -24, 14, 23, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.rotate(-marker.rotation * Math.PI / 180);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fillStyle = "#fff7d6"; ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "#334155"; ctx.font = `700 22px ${FONT}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(number), 0, 1);
  ctx.restore();
}

/** Render the full map scene, independent of viewport zoom, panels and controls. */
export async function createVenueMapImage(source: SVGSVGElement, markers: VenueMapMarker[]): Promise<Blob> {
  await document.fonts.ready;
  const summary = getMapImageSummary(markers);
  const listed = summary.visited.slice(0, 24);
  const rows = Math.max(1, Math.ceil(listed.length / 3));
  const listY = MAP_Y + MAP_HEIGHT + 70;
  const height = Math.ceil(listY + rows * 76 + 92);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unavailable");

  // SVG images must be self-contained for Safari and for an untainted canvas.
  const response = await fetch(VENUE_MAP_ASSET.href, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("map-unavailable");
  const map = source.cloneNode(true) as SVGSVGElement;
  map.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  map.setAttribute("width", String(MAP_WIDTH)); map.setAttribute("height", String(MAP_HEIGHT));
  map.removeAttribute("class"); map.removeAttribute("style");
  const base = map.querySelector("image");
  if (!base) throw new Error("map-unavailable");
  base.setAttribute("href", await asDataUrl(await response.blob()));
  const mapUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(map)], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await imageFromUrl(mapUrl);
    ctx.fillStyle = "#f8faf5"; ctx.fillRect(0, 0, WIDTH, height);
    ctx.fillStyle = "#0f3d32"; ctx.font = `700 56px ${FONT}`;
    ctx.fillText("制覇マップ", 56, 82);
    ctx.font = `24px ${FONT}`; ctx.fillStyle = "#52675e";
    ctx.fillText("訪れた場所に、花が咲く。", 58, 128);
    ctx.textAlign = "right"; ctx.font = `700 48px ${FONT}`; ctx.fillStyle = "#0f3d32";
    ctx.fillText(`${summary.visited.length} / ${summary.total} 訪問済み`, WIDTH - 56, 80);
    ctx.font = `24px ${FONT}`; ctx.fillStyle = "#52675e";
    ctx.fillText(`達成率 ${summary.percentage}%`, WIDTH - 56, 125);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff"; ctx.fillRect(MAP_X, MAP_Y, MAP_WIDTH, MAP_HEIGHT);
    ctx.drawImage(image, MAP_X, MAP_Y, MAP_WIDTH, MAP_HEIGHT);
    const indexById = new Map(summary.visited.map((marker, index) => [marker.id, index + 1]));
    const positions = getMapImagePositions(summary.markers);
    for (const point of positions) {
      if (Math.hypot(point.x - point.anchorX, point.y - point.anchorY) < 5) continue;
      ctx.strokeStyle = "#52675e"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(point.anchorX, point.anchorY); ctx.lineTo(point.x, point.y); ctx.stroke();
      ctx.fillStyle = "#52675e"; ctx.beginPath(); ctx.arc(point.anchorX, point.anchorY, 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const { marker, x, y } of positions) {
      drawFlower(ctx, marker, indexById.get(marker.id) ?? 0, x, y);
    }

    ctx.fillStyle = "#0f3d32"; ctx.font = `700 28px ${FONT}`;
    ctx.fillText("訪れたパビリオン", 56, listY);
    const columnWidth = (WIDTH - 112) / 3;
    listed.forEach((marker, index) => {
      const x = 56 + index % 3 * columnWidth;
      const y = listY + 48 + Math.floor(index / 3) * 76;
      ctx.fillStyle = marker.bloom; ctx.beginPath(); ctx.arc(x + 16, y - 8, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.font = `700 18px ${FONT}`; ctx.textAlign = "center";
      ctx.fillText(String(index + 1), x + 16, y - 2); ctx.textAlign = "left";
      ctx.fillStyle = "#243b32"; ctx.font = `700 24px ${FONT}`;
      fittedText(ctx, marker.name, x + 44, y, columnWidth - 65);
      ctx.fillStyle = "#64756d"; ctx.font = `19px ${FONT}`;
      fittedText(ctx, `${marker.areaName} · ${marker.visitCount}回`, x + 44, y + 28, columnWidth - 65);
    });
    if (!listed.length) {
      ctx.font = `24px ${FONT}`; ctx.fillStyle = "#64756d";
      ctx.fillText("最初の訪問を記録すると、地図に花が咲きます。", 56, listY + 50);
    }
    ctx.font = `21px ${FONT}`; ctx.fillStyle = "#64756d";
    const date = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeZone: "Asia/Tokyo" }).format(new Date());
    ctx.fillText(`${date} 作成${summary.visited.length > 24 ? ` · 一覧は24件まで表示（ほか${summary.visited.length - 24}件）` : ""}`, 56, height - 35);
    ctx.textAlign = "right"; ctx.font = `700 26px ${FONT}`; ctx.fillStyle = "#0f3d32";
    ctx.fillText("BloomLog", WIDTH - 56, height - 35);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("png-export")), "image/png");
    });
  } finally {
    URL.revokeObjectURL(mapUrl);
  }
}
