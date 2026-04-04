"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveContainer, Treemap, type TreemapNode } from "recharts";
import type {
  AreaGroupedPavilionTreemapGroup,
  AreaGroupedPavilionTreemapLeaf,
} from "@/lib/sessions";

type PavilionAlbumProps = {
  items: AreaGroupedPavilionTreemapGroup[];
  summary: {
    topArea: {
      areaId: string;
      name: string;
      value: number;
    } | null;
    topPavilion: {
      name: string;
      count: number;
      areaName: string | null;
    } | null;
  };
};

type TreemapContentProps = {
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  value?: number;
  imagePath?: string | null;
  latestSessionId?: string;
  areaChildren?: (TreemapNode & AreaGroupedPavilionTreemapLeaf)[] | null;
  onPavilionClick?: (latestSessionId: string) => void;
  tileId: string;
};

type AreaPalette = {
  fill: string;
  stroke: string;
  labelFill: string;
  tileFill: string;
  text: string;
  tileText: string;
};

function formatVisitCount(count: number) {
  return `${count}回`;
}

function wrapLabel(label: string, width: number, maxLines: number) {
  const compact = label.replace(/\s+/g, " ").trim();

  if (!compact) {
    return [];
  }

  const approxCharsPerLine = Math.max(4, Math.floor(width / 13));
  const glyphs = Array.from(compact);
  const lines: string[] = [];

  for (
    let index = 0;
    index < glyphs.length && lines.length < maxLines;
    index += approxCharsPerLine
  ) {
    const remainingLines = maxLines - lines.length;
    const remainingGlyphs = glyphs.length - index;

    if (remainingLines === 1 && remainingGlyphs > approxCharsPerLine) {
      lines.push(
        `${glyphs.slice(index, index + Math.max(approxCharsPerLine - 1, 1)).join("")}…`,
      );
      break;
    }

    lines.push(glyphs.slice(index, index + approxCharsPerLine).join(""));
  }

  return lines;
}

function getAreaPalette(areaName: string): AreaPalette {
  const normalized = areaName.toLowerCase();

  if (normalized.includes("east garden")) {
    return {
      fill: "rgba(236, 253, 245, 0.58)",
      stroke: "rgba(21, 128, 61, 0.82)",
      labelFill: "rgba(34, 197, 94, 0.88)",
      tileFill: "#dcfce7",
      text: "#f0fdf4",
      tileText: "#14532d",
    };
  }

  if (normalized.includes("global zone")) {
    return {
      fill: "rgba(239, 246, 255, 0.62)",
      stroke: "rgba(37, 99, 235, 0.82)",
      labelFill: "rgba(59, 130, 246, 0.9)",
      tileFill: "#dbeafe",
      text: "#eff6ff",
      tileText: "#1e3a8a",
    };
  }

  if (
    normalized.includes("festival station") ||
    normalized.includes("festival stage")
  ) {
    return {
      fill: "rgba(255, 247, 237, 0.62)",
      stroke: "rgba(234, 88, 12, 0.84)",
      labelFill: "rgba(249, 115, 22, 0.9)",
      tileFill: "#fed7aa",
      text: "#fff7ed",
      tileText: "#9a3412",
    };
  }

  if (
    normalized.includes("rose") ||
    normalized.includes("coral") ||
    normalized.includes("west")
  ) {
    return {
      fill: "rgba(255, 241, 242, 0.62)",
      stroke: "rgba(225, 29, 72, 0.76)",
      labelFill: "rgba(244, 63, 94, 0.88)",
      tileFill: "#fecdd3",
      text: "#fff1f2",
      tileText: "#9f1239",
    };
  }

  if (
    normalized.includes("violet") ||
    normalized.includes("purple") ||
    normalized.includes("signature")
  ) {
    return {
      fill: "rgba(245, 243, 255, 0.64)",
      stroke: "rgba(124, 58, 237, 0.76)",
      labelFill: "rgba(139, 92, 246, 0.88)",
      tileFill: "#ddd6fe",
      text: "#f5f3ff",
      tileText: "#5b21b6",
    };
  }

  if (normalized.includes("uncategorized")) {
    return {
      fill: "rgba(248, 250, 252, 0.8)",
      stroke: "rgba(71, 85, 105, 0.66)",
      labelFill: "rgba(100, 116, 139, 0.86)",
      tileFill: "#e2e8f0",
      text: "#f8fafc",
      tileText: "#334155",
    };
  }

  return {
    fill: "rgba(236, 253, 245, 0.6)",
    stroke: "rgba(13, 148, 136, 0.78)",
    labelFill: "rgba(15, 118, 110, 0.88)",
    tileFill: "#ccfbf1",
    text: "#f0fdfa",
    tileText: "#115e59",
  };
}

function PavilionTreemapTile({
  x,
  y,
  width,
  height,
  name,
  imagePath,
  value,
  latestSessionId,
  tileId,
  onClick,
  fill = "#f8fafc",
  textFill = "#0f172a",
}: Omit<TreemapContentProps, "depth" | "children"> & {
  onClick?: (latestSessionId: string) => void;
  fill?: string;
  textFill?: string;
}) {
  const clipPathId = `treemap-clip-${tileId}`;
  const gradientId = `treemap-gradient-${tileId}`;
  const showImageBackground =
    Boolean(imagePath) && width >= 28 && height >= 28;
  const showLabel = width >= 88 && height >= 64;
  const showCount = width >= 110 && height >= 84;
  const padding = width >= 160 && height >= 132 ? 16 : 10;
  const titleFontSize =
    width >= 180 || height >= 170 ? 18 : width >= 120 ? 14 : 12;
  const titleLines = showLabel
    ? wrapLabel(String(name ?? ""), width - padding * 2, height >= 124 ? 2 : 1)
    : [];
  const labelBaseY =
    y +
    height -
    padding -
    (showCount ? 18 : 0) -
    Math.max(titleLines.length - 1, 0) * (titleFontSize + 2);
  const handleClick = latestSessionId && onClick
    ? () => onClick(latestSessionId)
    : undefined;

  return (
    <g
      onClick={handleClick}
      style={{
        cursor: handleClick ? "pointer" : "default",
      }}
    >
      <defs>
        <clipPath id={clipPathId}>
          <rect
            x={x + 1.5}
            y={y + 1.5}
            width={Math.max(width - 3, 0)}
            height={Math.max(height - 3, 0)}
          />
        </clipPath>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={
              showImageBackground
                ? "rgba(15,23,42,0.02)"
                : "rgba(255,255,255,0.12)"
            }
          />
          <stop
            offset="55%"
            stopColor={
              showImageBackground
                ? "rgba(15,23,42,0.10)"
                : "rgba(255,255,255,0.02)"
            }
          />
          <stop
            offset="100%"
            stopColor={
              showImageBackground
                ? "rgba(15,23,42,0.76)"
                : "rgba(15,23,42,0.10)"
            }
          />
        </linearGradient>
      </defs>

      <rect
        x={x + 1.5}
        y={y + 1.5}
        width={Math.max(width - 3, 0)}
        height={Math.max(height - 3, 0)}
        fill={showImageBackground ? "#e2e8f0" : fill}
        stroke="rgba(255,255,255,0.96)"
        strokeWidth={1.5}
      />

      {showImageBackground ? (
        <image
          href={imagePath ?? undefined}
          x={x + 1.5}
          y={y + 1.5}
          width={Math.max(width - 3, 0)}
          height={Math.max(height - 3, 0)}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipPathId})`}
        />
      ) : (
        <rect
          x={x + 1.5}
          y={y + 1.5}
          width={Math.max(width - 3, 0)}
          height={Math.max(height - 3, 0)}
          fill={fill}
        />
      )}

      <rect
        x={x + 1.5}
        y={y + 1.5}
        width={Math.max(width - 3, 0)}
        height={Math.max(height - 3, 0)}
        fill={`url(#${gradientId})`}
      />

      {showLabel
        ? titleLines.map((line, index) => (
            <text
              key={`${tileId}-${index}`}
              x={x + padding}
              y={labelBaseY + index * (titleFontSize + 2)}
              fill={showImageBackground ? "rgba(255,255,255,0.98)" : textFill}
              fontSize={titleFontSize}
              fontWeight={700}
            >
              {line}
            </text>
          ))
        : null}

      {showCount ? (
        <text
          x={x + padding}
          y={y + height - padding}
          fill={showImageBackground ? "rgba(255,255,255,0.86)" : textFill}
          fontSize={12}
          fontWeight={600}
        >
          {formatVisitCount(Number(value ?? 0))}
        </text>
      ) : null}
    </g>
  );
}

function AreaTreemapContent({
  depth,
  x,
  y,
  width,
  height,
  name,
  areaChildren,
  onPavilionClick,
}: TreemapContentProps) {
  if (depth !== 1 || width <= 0 || height <= 0) {
    return <g />;
  }

  const areaInset = width >= 260 && height >= 220 ? 8 : 6;
  const innerX = x + areaInset;
  const innerY = y + areaInset;
  const innerWidth = Math.max(width - areaInset * 2, 0);
  const innerHeight = Math.max(height - areaInset * 2, 0);
  const labelBandHeight = Math.min(
    Math.max(height >= 220 ? 36 : 30, 26),
    Math.max(Math.floor(innerHeight * 0.22), 24),
  );
  const contentInset = innerWidth >= 220 ? 6 : 4;
  const childRegionX = innerX + contentInset;
  const childRegionY = innerY + labelBandHeight;
  const childRegionWidth = Math.max(innerWidth - contentInset * 2, 0);
  const childRegionHeight = Math.max(
    innerHeight - labelBandHeight - contentInset,
    0,
  );
  const padding = innerWidth >= 220 ? 16 : 10;
  const titleLines = wrapLabel(String(name ?? ""), innerWidth - padding * 2, 2);
  const titleFontSize = innerWidth >= 240 ? 19 : innerWidth >= 180 ? 17 : 14;
  const labelY = innerY + 22;
  const labelPlateWidth = Math.max(
    Math.min(innerWidth - 16, Math.max(128, innerWidth * 0.42)),
    72,
  );
  const palette = getAreaPalette(String(name ?? ""));
  const pavilionChildren = (areaChildren ?? []).filter((child) =>
    child.depth === 2 &&
    child.width > 0 &&
    child.height > 0 &&
    width > 0 &&
    height > 0
  );

  return (
    <g>
      <rect
        x={innerX}
        y={innerY}
        width={innerWidth}
        height={innerHeight}
        fill={palette.fill}
        stroke={palette.stroke}
        strokeWidth={2.25}
      />

      <rect
        x={innerX}
        y={innerY + 8}
        width={labelPlateWidth}
        height={Math.max(labelBandHeight - 10, 20)}
        fill={palette.labelFill}
      />

      {pavilionChildren.map((child) => {
        const scaledX = childRegionX + ((child.x - x) / width) * childRegionWidth;
        const scaledY = childRegionY + ((child.y - y) / height) * childRegionHeight;
        const scaledWidth = (child.width / width) * childRegionWidth;
        const scaledHeight = (child.height / height) * childRegionHeight;

        return (
          <PavilionTreemapTile
            key={String(
              child.tooltipIndex ??
                child.name ??
                child.index ??
                child.latestSessionId,
            )}
            x={scaledX}
            y={scaledY}
            width={scaledWidth}
            height={scaledHeight}
            name={typeof child.name === "string" ? child.name : undefined}
            value={typeof child.value === "number" ? child.value : undefined}
            imagePath={child.imagePath ?? null}
            latestSessionId={child.latestSessionId}
            fill={palette.tileFill}
            textFill={palette.tileText}
            tileId={String(
              child.tooltipIndex ??
                child.name ??
                child.index ??
                "tile",
            ).replace(/[^a-zA-Z0-9_-]/g, "-")}
            onClick={onPavilionClick}
          />
        );
      })}

      {titleLines.map((line, index) => (
        <text
          key={`area-${name}-${index}`}
          x={innerX + padding}
          y={labelY + index * (titleFontSize + 3) - 2}
          fill={palette.text}
          fontSize={titleFontSize + 1}
          fontWeight={900}
          letterSpacing="0.01em"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export function PavilionAlbum({ items, summary }: PavilionAlbumProps) {
  const router = useRouter();

  useEffect(() => {
    console.log("[collection-next] grouped treemap data", items);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-white px-6 py-10 text-sm leading-7 text-slate-600">
        まだ area_id が解決できるパビリオン訪問はありません。
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden bg-white shadow-sm ring-1 ring-emerald-100/80">
        <div className="relative h-[560px] w-full bg-[linear-gradient(180deg,#f8fffc_0%,#effcf7_100%)] sm:h-[640px] lg:h-[720px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={items}
              dataKey="value"
              nameKey="name"
              aspectRatio={1.35}
              stroke="rgba(255,255,255,0)"
              fill="#d1fae5"
              isAnimationActive={false}
              content={(node) => {
                const treemapNode = node as TreemapNode & {
                  children?: (TreemapNode & AreaGroupedPavilionTreemapLeaf)[] | null;
                  name?: string;
                };

                return (
                  <AreaTreemapContent
                    depth={treemapNode.depth}
                    x={treemapNode.x}
                    y={treemapNode.y}
                    width={treemapNode.width}
                    height={treemapNode.height}
                    name={
                      typeof treemapNode.name === "string"
                        ? treemapNode.name
                        : undefined
                    }
                    areaChildren={treemapNode.children ?? null}
                    onPavilionClick={(sessionId) => {
                      router.push(`/sessions/${sessionId}`);
                    }}
                    tileId={String(
                      treemapNode.tooltipIndex ??
                        treemapNode.name ??
                        treemapNode.index ??
                        "group",
                    ).replace(/[^a-zA-Z0-9_-]/g, "-")}
                  />
                );
              }}
            >
              <defs>
                <linearGradient
                  id="treemap-soft-fill"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#dcfce7" />
                </linearGradient>
                <linearGradient
                  id="treemap-strong-fill"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#ecfdf5" />
                  <stop offset="100%" stopColor="#bfdbfe" />
                </linearGradient>
              </defs>
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            最も多いゾーン
          </p>
          <p className="mt-3 text-xl font-semibold text-slate-900">
            {summary.topArea?.name ?? "まだありません"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {summary.topArea ? `${formatVisitCount(summary.topArea.value)}の訪問` : "pavilion_visit が追加されると表示されます。"}
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-50/60 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-700">
            最も多いパビリオン
          </p>
          <p className="mt-3 text-xl font-semibold text-slate-900">
            {summary.topPavilion?.name ?? "まだありません"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {summary.topPavilion
              ? `${formatVisitCount(summary.topPavilion.count)}の訪問`
              : "pavilion_visit が追加されると表示されます。"}
          </p>
          {summary.topPavilion?.areaName ? (
            <p className="mt-1 text-xs text-slate-500">
              所属ゾーン: {summary.topPavilion.areaName}
            </p>
          ) : null}
        </section>
      </div>

      <p className="text-sm leading-6 text-slate-500">
        面積で訪問の偏りを見せることを優先し、小さいパビリオンはラベルを省略しています。
      </p>
    </section>
  );
}
