"use client";

import { useMemo } from "react";
import type { CarbonIntensityHistoryPoint } from "@/lib/electricityMaps";
import styles from "./HistoryChart.module.css";

interface Props {
  history: CarbonIntensityHistoryPoint[];
}

function intensityColor(v: number): string {
  if (v < 100) return "#3ddc97";
  if (v < 200) return "#7bdf5a";
  if (v < 350) return "#f5c842";
  if (v < 500) return "#f58642";
  return "#f54242";
}

export function HistoryChart({ history }: Props) {
  const W = 800;
  const H = 120;
  const PAD = { top: 12, right: 8, bottom: 24, left: 44 };

  const data = useMemo(() => {
    const pts = history.slice(-24); // last 24 points
    if (pts.length < 2) return null;
    const values = pts.map((p) => p.carbonIntensity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const coords = pts.map((p, i) => ({
      x: PAD.left + (i / (pts.length - 1)) * innerW,
      y: PAD.top + innerH - ((p.carbonIntensity - min) / range) * innerH,
      value: p.carbonIntensity,
      datetime: p.datetime,
    }));

    const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");

    // Area fill path
    const area = [
      `M ${coords[0].x} ${PAD.top + innerH}`,
      coords.map((c) => `L ${c.x} ${c.y}`).join(" "),
      `L ${coords[coords.length - 1].x} ${PAD.top + innerH}`,
      "Z",
    ].join(" ");

    // Y-axis ticks
    const tickCount = 4;
    const ticks = Array.from({ length: tickCount }, (_, i) => {
      const frac = i / (tickCount - 1);
      const val = Math.round(min + frac * range);
      const y = PAD.top + innerH - frac * innerH;
      return { val, y };
    });

    // X-axis labels (every ~6 points)
    const xLabels = pts
      .map((p, i) => ({ i, datetime: p.datetime }))
      .filter((_, i, arr) => i === 0 || i === arr.length - 1 || i % 6 === 0);

    return { coords, polyline, area, ticks, xLabels, min, max, innerW, innerH };
  }, [history]);

  if (!data) return null;

  const latest = history[history.length - 1];
  const gradId = "ciGrad";
  const maskId = "ciMask";

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={styles.svg}
        aria-label="24-hour carbon intensity history"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={intensityColor(latest.carbonIntensity)} stopOpacity="0.25" />
            <stop offset="100%" stopColor={intensityColor(latest.carbonIntensity)} stopOpacity="0.02" />
          </linearGradient>
          <clipPath id={maskId}>
            <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {data.ticks.map((t) => (
          <line
            key={t.val}
            x1={PAD.left}
            y1={t.y}
            x2={W - PAD.right}
            y2={t.y}
            stroke="#1f2a3a"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={data.area} fill={`url(#${gradId})`} clipPath={`url(#${maskId})`} />

        {/* Line */}
        <polyline
          points={data.polyline}
          fill="none"
          stroke={intensityColor(latest.carbonIntensity)}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath={`url(#${maskId})`}
        />

        {/* Y-axis labels */}
        {data.ticks.map((t) => (
          <text
            key={t.val}
            x={PAD.left - 6}
            y={t.y + 4}
            textAnchor="end"
            fontSize="9"
            fill="#8a9bb0"
          >
            {t.val}
          </text>
        ))}

        {/* X-axis labels */}
        {data.xLabels.map(({ i, datetime }) => {
          const x = PAD.left + (i / (data.coords.length - 1)) * data.innerW;
          const label = new Date(datetime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          return (
            <text
              key={i}
              x={x}
              y={H - 4}
              textAnchor="middle"
              fontSize="9"
              fill="#8a9bb0"
            >
              {label}
            </text>
          );
        })}

        {/* Latest dot */}
        {(() => {
          const last = data.coords[data.coords.length - 1];
          return (
            <>
              <circle cx={last.x} cy={last.y} r="4" fill={intensityColor(latest.carbonIntensity)} />
              <circle cx={last.x} cy={last.y} r="7" fill="none" stroke={intensityColor(latest.carbonIntensity)} strokeWidth="1" opacity="0.4" />
            </>
          );
        })()}
      </svg>
    </div>
  );
}
