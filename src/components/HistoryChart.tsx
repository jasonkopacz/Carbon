"use client";

import { useMemo } from "react";
import type { CarbonIntensityHistoryPoint } from "@/lib/electricityMaps";
import { intensityColor } from "@/lib/intensity";
import styles from "./HistoryChart.module.css";

const BEST_THRESHOLD = 150; // gCO₂eq/kWh — shade green below this

interface Props {
  history: CarbonIntensityHistoryPoint[];
  forecast?: CarbonIntensityHistoryPoint[];
}

const PAD = { top: 14, right: 10, bottom: 26, left: 46 };

export function HistoryChart({ history, forecast }: Props) {
  const W = 800;
  const H = 140;

  const data = useMemo(() => {
    const histPts = history.slice(-24);
    const forecastPts = (forecast ?? []).slice(0, 24);

    // All points for scale
    const allPts = [...histPts, ...forecastPts];
    if (allPts.length < 2) return null;

    const values = allPts.map((p) => p.carbonIntensity);
    const min = Math.max(0, Math.min(...values) - 20);
    const max = Math.max(...values) + 20;
    const range = max - min || 1;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const totalPts = allPts.length;

    function toCoord(p: CarbonIntensityHistoryPoint, i: number) {
      return {
        x: PAD.left + (i / (totalPts - 1)) * innerW,
        y: PAD.top + innerH - ((p.carbonIntensity - min) / range) * innerH,
        value: p.carbonIntensity,
        datetime: p.datetime,
      };
    }

    const histCoords = histPts.map(toCoord);
    const forecastCoords = forecastPts.map((p, i) =>
      toCoord(p, histPts.length + i),
    );

    function toPolyline(coords: ReturnType<typeof toCoord>[]) {
      return coords.map((c) => `${c.x},${c.y}`).join(" ");
    }

    function toArea(coords: ReturnType<typeof toCoord>[]) {
      if (coords.length === 0) return "";
      return [
        `M ${coords[0].x} ${PAD.top + innerH}`,
        coords.map((c) => `L ${c.x} ${c.y}`).join(" "),
        `L ${coords[coords.length - 1].x} ${PAD.top + innerH}`,
        "Z",
      ].join(" ");
    }

    // Best-hour bands: consecutive forecast points below threshold
    const bestBands: { x1: number; x2: number }[] = [];
    let bandStart: number | null = null;
    forecastCoords.forEach((c, i) => {
      const isBest = c.value <= BEST_THRESHOLD;
      if (isBest && bandStart === null) bandStart = c.x;
      if (!isBest && bandStart !== null) {
        bestBands.push({ x1: bandStart, x2: forecastCoords[i - 1].x });
        bandStart = null;
      }
      if (i === forecastCoords.length - 1 && bandStart !== null) {
        bestBands.push({ x1: bandStart, x2: c.x });
        bandStart = null;
      }
    });

    // Y-axis ticks
    const tickCount = 4;
    const ticks = Array.from({ length: tickCount }, (_, i) => {
      const frac = i / (tickCount - 1);
      return {
        val: Math.round(min + frac * range),
        y: PAD.top + innerH - frac * innerH,
      };
    });

    // X-axis labels — pick ~5 evenly spaced across all points
    const xLabelIndices = [0, Math.floor(totalPts * 0.25), Math.floor(totalPts * 0.5), Math.floor(totalPts * 0.75), totalPts - 1];
    const xLabels = xLabelIndices.map((idx) => ({
      x: PAD.left + (idx / (totalPts - 1)) * innerW,
      label: new Date(allPts[idx].datetime).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit", hour12: false,
      }),
    }));

    // The dividing x between history and forecast
    const dividerX = histCoords.length > 0
      ? histCoords[histCoords.length - 1].x
      : null;

    const latestHistory = histPts[histPts.length - 1];

    return {
      histCoords, forecastCoords,
      histArea: toArea(histCoords),
      forecastArea: toArea(forecastCoords),
      histLine: toPolyline(histCoords),
      forecastLine: toPolyline(forecastCoords),
      ticks, xLabels, bestBands, dividerX,
      innerH, innerW,
      latestColor: intensityColor(latestHistory?.carbonIntensity ?? 300),
    };
  }, [history, forecast]);

  if (!data) return null;

  const gradHistId  = "gradHist";
  const gradFcstId  = "gradFcst";
  const clipId      = "ciClip";

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={styles.svg}
        aria-label="Carbon intensity history and forecast"
      >
        <defs>
          <linearGradient id={gradHistId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={data.latestColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={data.latestColor} stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id={gradFcstId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a9bb0" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#8a9bb0" stopOpacity="0.01" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} />
          </clipPath>
        </defs>

        {/* Horizontal grid lines */}
        {data.ticks.map((t) => (
          <line key={t.val} x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y}
            stroke="#1f2a3a" strokeWidth="1" />
        ))}

        {/* Best-hour bands */}
        {data.bestBands.map((b, i) => (
          <rect
            key={i}
            x={b.x1} y={PAD.top}
            width={b.x2 - b.x1}
            height={H - PAD.top - PAD.bottom}
            fill="rgba(61,220,151,0.07)"
            clipPath={`url(#${clipId})`}
          />
        ))}

        {/* Divider line between history and forecast */}
        {data.dividerX && (
          <line
            x1={data.dividerX} y1={PAD.top}
            x2={data.dividerX} y2={H - PAD.bottom}
            stroke="#1f2a3a" strokeWidth="1" strokeDasharray="3 3"
          />
        )}

        {/* History area + line */}
        {data.histArea && (
          <path d={data.histArea} fill={`url(#${gradHistId})`} clipPath={`url(#${clipId})`} />
        )}
        {data.histLine && (
          <polyline points={data.histLine} fill="none"
            stroke={data.latestColor} strokeWidth="1.75"
            strokeLinejoin="round" strokeLinecap="round"
            clipPath={`url(#${clipId})`} />
        )}

        {/* Forecast area + dashed line */}
        {data.forecastArea && (
          <path d={data.forecastArea} fill={`url(#${gradFcstId})`} clipPath={`url(#${clipId})`} />
        )}
        {data.forecastLine && (
          <polyline points={data.forecastLine} fill="none"
            stroke="#8a9bb0" strokeWidth="1.5" strokeDasharray="4 3"
            strokeLinejoin="round" strokeLinecap="round"
            clipPath={`url(#${clipId})`} />
        )}

        {/* Y-axis labels */}
        {data.ticks.map((t) => (
          <text key={t.val} x={PAD.left - 6} y={t.y + 4}
            textAnchor="end" fontSize="9" fill="#8a9bb0">
            {t.val}
          </text>
        ))}

        {/* X-axis labels */}
        {data.xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - 4}
            textAnchor="middle" fontSize="9" fill="#8a9bb0">
            {l.label}
          </text>
        ))}

        {/* Latest dot */}
        {data.histCoords.length > 0 && (() => {
          const last = data.histCoords[data.histCoords.length - 1];
          return (
            <>
              <circle cx={last.x} cy={last.y} r="4" fill={data.latestColor} />
              <circle cx={last.x} cy={last.y} r="7" fill="none"
                stroke={data.latestColor} strokeWidth="1" opacity="0.4" />
            </>
          );
        })()}
      </svg>

      {/* Chart legend row */}
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}>
          <span className={styles.legendLine} style={{ background: data.latestColor }} />
          Past 24h
        </span>
        {data.forecastCoords.length > 0 && (
          <span className={styles.legendItem}>
            <span className={`${styles.legendLine} ${styles.dashed}`} />
            Forecast
          </span>
        )}
        {data.bestBands.length > 0 && (
          <span className={styles.legendItem}>
            <span className={styles.bestBand} />
            Best hours (&lt;{BEST_THRESHOLD} g)
          </span>
        )}
      </div>
    </div>
  );
}
