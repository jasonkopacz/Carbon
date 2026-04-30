"use client";

import { useMemo } from "react";
import type { PowerSources } from "@/lib/electricityMaps";
import styles from "./DonutChart.module.css";

interface Props {
  breakdown: PowerSources;
  total: number;
}

const RENEWABLE_SOURCES = new Set(["solar", "wind", "hydro", "hydro discharge", "geothermal", "biomass"]);
const NUCLEAR_SOURCES   = new Set(["nuclear"]);
const FOSSIL_SOURCES    = new Set(["coal", "gas", "oil"]);

const SEGMENTS = [
  { key: "renewable", label: "Renewable",   color: "#3ddc97" },
  { key: "nuclear",   label: "Nuclear",      color: "#a78bfa" },
  { key: "fossil",    label: "Fossil",       color: "#f97316" },
  { key: "other",     label: "Other",        color: "#4b5563" },
] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  if (endDeg - startDeg >= 360) endDeg = startDeg + 359.99;
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function DonutChart({ breakdown, total }: Props) {
  const data = useMemo(() => {
    let renewable = 0, nuclear = 0, fossil = 0, other = 0;
    for (const [key, val] of Object.entries(breakdown)) {
      const v = val ?? 0;
      if (RENEWABLE_SOURCES.has(key)) renewable += v;
      else if (NUCLEAR_SOURCES.has(key)) nuclear += v;
      else if (FOSSIL_SOURCES.has(key)) fossil += v;
      else other += v;
    }
    const t = total || 1;
    return [
      { ...SEGMENTS[0], value: renewable, pct: (renewable / t) * 100 },
      { ...SEGMENTS[1], value: nuclear,   pct: (nuclear   / t) * 100 },
      { ...SEGMENTS[2], value: fossil,    pct: (fossil     / t) * 100 },
      { ...SEGMENTS[3], value: other,     pct: (other      / t) * 100 },
    ].filter((s) => s.value > 0);
  }, [breakdown, total]);

  const fossilFree = useMemo(() => {
    const fossil = data.find((d) => d.key === "fossil");
    return Math.round(100 - (fossil?.pct ?? 0));
  }, [data]);

  const SIZE = 180;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 72;
  const STROKE = 18;
  const GAP = 2; // degrees gap between segments

  let cursor = 0;
  const arcs = data.map((seg) => {
    const sweep = (seg.pct / 100) * 360;
    const start = cursor + GAP / 2;
    const end   = cursor + sweep - GAP / 2;
    cursor += sweep;
    return { ...seg, start, end };
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.donut}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {arcs.map((arc) => (
            <path
              key={arc.key}
              d={arcPath(cx, cy, R, arc.start, arc.end)}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          ))}
          {/* Center label */}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#e8eef5">
            {fossilFree}%
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9.5" fill="#8a9bb0" letterSpacing="0.05em">
            FOSSIL-FREE
          </text>
        </svg>
      </div>
      <div className={styles.legend}>
        {data.map((seg) => (
          <div key={seg.key} className={styles.legendRow}>
            <span className={styles.legendDot} style={{ background: seg.color }} />
            <span className={styles.legendLabel}>{seg.label}</span>
            <span className={styles.legendPct}>{seg.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
