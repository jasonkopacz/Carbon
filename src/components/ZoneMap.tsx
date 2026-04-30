"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import zoneNamesJson from "@/lib/zone_names.json";
import styles from "./ZoneMap.module.css";

const GEO_URL = "/countries-110m.json";

// ── Zone catalog ─────────────────────────────────────────────────────────────
const catalog = (
  zoneNamesJson as {
    zoneShortName: Record<
      string,
      { zoneName?: string; countryName?: string; displayName?: string }
    >;
  }
).zoneShortName;

function getZoneName(key: string): string {
  const e = catalog[key];
  if (!e) return key;
  return e.displayName ?? e.zoneName ?? key;
}

function getCountryName(key: string): string | null {
  return catalog[key]?.countryName ?? null;
}

// ── Zone centroids [lon, lat] ────────────────────────────────────────────────
const ZONE_CENTROIDS: Record<string, [number, number]> = {
  "DE": [10.4, 51.2], "FR": [2.3, 46.6], "GB": [-1.5, 52.4], "ES": [-3.7, 40.4],
  "IT": [12.5, 42.5], "PL": [19.1, 52.1], "NL": [5.3, 52.3], "BE": [4.5, 50.5],
  "SE": [15.0, 60.1], "NO": [8.5, 60.5], "FI": [25.7, 61.9], "DK": [10.0, 56.3],
  "AT": [14.5, 47.5], "CH": [8.2, 46.8], "PT": [-8.2, 39.4], "CZ": [15.5, 49.8],
  "HU": [19.0, 47.2], "RO": [25.0, 45.9], "GR": [21.8, 39.1], "BG": [25.5, 42.7],
  "SK": [19.5, 48.7], "HR": [15.9, 45.1], "RS": [21.0, 44.0], "SI": [14.9, 46.1],
  "US-CAL-CISO": [-119.4, 36.8], "US-TEX-ERCO": [-99.3, 31.5], "US-NY-NYIS": [-74.0, 42.9],
  "US-MIDA-PJM": [-78.0, 39.5], "US-MIDW-MISO": [-93.0, 44.5], "US-NW-PACW": [-120.5, 46.5],
  "US-SE-SERC": [-84.0, 33.5], "US-NE-ISNE": [-71.5, 42.3], "US-SW-SRP": [-111.7, 33.4],
  "CA-ON": [-85.0, 50.0], "CA-QC": [-72.0, 52.0], "CA-BC": [-124.0, 54.0],
  "CA-AB": [-114.0, 53.0], "CA-SK": [-106.0, 54.0], "CA-MB": [-98.0, 55.0],
  "JP-TK": [139.7, 35.7], "JP-KN": [135.5, 34.7], "JP-CB": [137.4, 35.2],
  "JP-TH": [140.9, 38.3], "JP-HKD": [143.1, 43.3], "JP-KY": [130.9, 33.0],
  "AU-NSW": [146.9, -31.9], "AU-VIC": [144.9, -36.8], "AU-QLD": [144.1, -22.6],
  "AU-SA": [135.8, -30.0], "AU-WA": [122.2, -25.0],
  "IN-NO": [77.0, 28.6], "IN-SO": [80.2, 13.1], "IN-WE": [72.8, 21.2], "IN-EA": [85.8, 20.3],
  "CN": [104.2, 35.9], "KR": [127.8, 37.6], "TW": [120.9, 23.7],
  "BR-CS": [-47.9, -15.8], "BR-N": [-60.0, -3.0], "BR-NE": [-38.5, -7.0],
  "BR-S": [-51.2, -28.0], "AR": [-64.0, -34.0], "CL": [-70.0, -30.0],
  "ZA": [25.0, -29.0], "NG": [7.5, 9.1], "KE": [37.9, 0.0], "EG": [30.8, 27.0],
  "MA": [-6.8, 31.8], "DK-DK1": [9.4, 56.0], "DK-DK2": [12.0, 55.5],
  "SE-SE1": [20.0, 67.0], "SE-SE2": [17.5, 64.0], "SE-SE3": [17.5, 60.0], "SE-SE4": [14.0, 56.5],
  "NO-NO1": [10.0, 59.5], "NO-NO2": [7.0, 60.5], "NO-NO3": [11.0, 63.5],
  "NO-NO4": [17.0, 68.0], "NO-NO5": [6.0, 62.0],
};

// ── Intensity helpers ─────────────────────────────────────────────────────────
function intensityColor(v: number | null): string {
  if (v == null) return "#374151";
  if (v < 100) return "#3ddc97";
  if (v < 200) return "#7bdf5a";
  if (v < 350) return "#f5c842";
  if (v < 500) return "#f58642";
  return "#f54242";
}

function intensityLabel(v: number | null): string {
  if (v == null) return "No data";
  if (v < 100) return "Very low";
  if (v < 200) return "Low";
  if (v < 350) return "Moderate";
  if (v < 500) return "High";
  return "Very high";
}

type ZoneStatus = { key: string; intensity: number | null };
type TooltipState = { x: number; y: number; key: string; intensity: number | null };

// ── Component ────────────────────────────────────────────────────────────────
export function ZoneMap() {
  const router = useRouter();
  const [zones, setZones] = useState<Record<string, ZoneStatus>>({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const keys = Object.keys(ZONE_CENTROIDS);
    let cancelled = false;
    let done = 0;

    Promise.allSettled(
      keys.map((key) =>
        fetch(`/api/zones/intensity?zone=${encodeURIComponent(key)}`)
          .then((r) => r.json())
          .then((d) => {
            if (cancelled) return;
            done++;
            setProgress(Math.round((done / keys.length) * 100));
            setZones((prev) => ({
              ...prev,
              [key]: { key, intensity: d.carbonIntensity ?? null },
            }));
          })
          .catch(() => {
            if (!cancelled) {
              done++;
              setProgress(Math.round((done / keys.length) * 100));
            }
          }),
      ),
    ).then(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const handleMarkerClick = useCallback(
    (key: string) => router.push(`/z/${encodeURIComponent(key)}`),
    [router],
  );

  return (
    <div className={styles.wrap}>
      {/* Loading overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingInner}>
            <span className={styles.loadingText}>
              Loading live intensities… {progress}%
            </span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Map container — separate div so the CSS selector doesn't hit tooltip */}
      <div className={styles.mapContainer}>
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{ scale: 153, center: [0, 10] }}
          style={{ width: "100%", height: "100%", background: "#060b10" }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#111827"
                    stroke="#1e293b"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none", fill: "#1a2535" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {Object.keys(ZONE_CENTROIDS).map((key) => {
              const coords = ZONE_CENTROIDS[key];
              const status = zones[key];
              const color = intensityColor(status?.intensity ?? null);
              return (
                <Marker
                  key={key}
                  coordinates={coords}
                  onClick={() => handleMarkerClick(key)}
                  onMouseEnter={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, key, intensity: status?.intensity ?? null })
                  }
                  onMouseMove={(e) =>
                    setTooltip((prev) =>
                      prev?.key === key ? { ...prev, x: e.clientX, y: e.clientY } : prev,
                    )
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: "pointer" }}
                >
                  <circle r={10} fill="transparent" />
                  <circle r={6} fill={color} opacity={0.18} />
                  <circle r={4} fill={color} stroke="#060b10" strokeWidth={1} />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Rich tooltip — position:fixed so clientX/Y work directly */}
      {tooltip && (() => {
        const color = intensityColor(tooltip.intensity);
        const label = intensityLabel(tooltip.intensity);
        const name  = getZoneName(tooltip.key);
        const country = getCountryName(tooltip.key);
        const hasData = tooltip.intensity != null;
        return (
          <div
            className={styles.tooltip}
            style={{ left: tooltip.x, top: tooltip.y - 16, transform: "translate(-50%, -100%)" }}
          >
            <div className={styles.tooltipHeader}>
              <span className={styles.tooltipCode}>{tooltip.key}</span>
              {name !== tooltip.key && (
                <span className={styles.tooltipName}>{name}</span>
              )}
              {country && name !== country && (
                <span className={styles.tooltipCountry}>{country}</span>
              )}
            </div>

            <div className={styles.tooltipDivider} />

            {hasData ? (
              <>
                <div className={styles.tooltipIntensity}>
                  <span className={styles.tooltipValue} style={{ color }}>{tooltip.intensity}</span>
                  <span className={styles.tooltipUnit}>gCO₂eq / kWh</span>
                </div>
                <span
                  className={styles.tooltipBadge}
                  style={{ color, background: color + "1a", border: `1px solid ${color}44` }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: color, display: "inline-block", flexShrink: 0,
                  }} />
                  {label}
                </span>
              </>
            ) : (
              <span className={styles.tooltipNoData}>No live data</span>
            )}

            <div className={styles.tooltipDivider} />
            <span className={styles.tooltipHint}>
              <span className={styles.tooltipArrow}>→</span> Click to open zone details
            </span>
          </div>
        );
      })()}
    </div>
  );
}
