"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Marker,
  Sphere,
  ZoomableGroup,
} from "react-simple-maps";
import zoneNamesJson from "@/lib/zone_names.json";
import { intensityColor, intensityLabel } from "@/lib/intensity";
import styles from "./ZoneMap.module.css";

const GEO_URL  = "/countries-50m.json";
const MIN_ZOOM = 1;
const MAX_ZOOM = 12;
const ZOOM_STEP = 1.6;
const ANIM_MS   = 320; // button zoom animation duration

// ── Zone catalog ──────────────────────────────────────────────────────────────
const catalog = (
  zoneNamesJson as {
    zoneShortName: Record<
      string,
      { zoneName?: string; countryName?: string; displayName?: string }
    >;
  }
).zoneShortName;

function getZoneName(key: string) {
  const e = catalog[key];
  return e ? (e.displayName ?? e.zoneName ?? key) : key;
}
function getCountryName(key: string) {
  return catalog[key]?.countryName ?? null;
}

// ── Zone centroids [lon, lat] ─────────────────────────────────────────────────
const ZONE_CENTROIDS: Record<string, [number, number]> = {
  "DE":[10.4,51.2],"FR":[2.3,46.6],"GB":[-1.5,52.4],"ES":[-3.7,40.4],
  "IT":[12.5,42.5],"PL":[19.1,52.1],"NL":[5.3,52.3],"BE":[4.5,50.5],
  "SE":[15.0,60.1],"NO":[8.5,60.5],"FI":[25.7,61.9],"DK":[10.0,56.3],
  "AT":[14.5,47.5],"CH":[8.2,46.8],"PT":[-8.2,39.4],"CZ":[15.5,49.8],
  "HU":[19.0,47.2],"RO":[25.0,45.9],"GR":[21.8,39.1],"BG":[25.5,42.7],
  "SK":[19.5,48.7],"HR":[15.9,45.1],"RS":[21.0,44.0],"SI":[14.9,46.1],
  "US-CAL-CISO":[-119.4,36.8],"US-TEX-ERCO":[-99.3,31.5],"US-NY-NYIS":[-74.0,42.9],
  "US-MIDA-PJM":[-78.0,39.5],"US-MIDW-MISO":[-93.0,44.5],"US-NW-PACW":[-120.5,46.5],
  "US-SE-SERC":[-84.0,33.5],"US-NE-ISNE":[-71.5,42.3],"US-SW-SRP":[-111.7,33.4],
  "CA-ON":[-85.0,50.0],"CA-QC":[-72.0,52.0],"CA-BC":[-124.0,54.0],
  "CA-AB":[-114.0,53.0],"CA-SK":[-106.0,54.0],"CA-MB":[-98.0,55.0],
  "JP-TK":[139.7,35.7],"JP-KN":[135.5,34.7],"JP-CB":[137.4,35.2],
  "JP-TH":[140.9,38.3],"JP-HKD":[143.1,43.3],"JP-KY":[130.9,33.0],
  "AU-NSW":[146.9,-31.9],"AU-VIC":[144.9,-36.8],"AU-QLD":[144.1,-22.6],
  "AU-SA":[135.8,-30.0],"AU-WA":[122.2,-25.0],
  "IN-NO":[77.0,28.6],"IN-SO":[80.2,13.1],"IN-WE":[72.8,21.2],"IN-EA":[85.8,20.3],
  "CN":[104.2,35.9],"KR":[127.8,37.6],"TW":[120.9,23.7],
  "BR-CS":[-47.9,-15.8],"BR-N":[-60.0,-3.0],"BR-NE":[-38.5,-7.0],
  "BR-S":[-51.2,-28.0],"AR":[-64.0,-34.0],"CL":[-70.0,-30.0],
  "ZA":[25.0,-29.0],"NG":[7.5,9.1],"KE":[37.9,0.0],"EG":[30.8,27.0],
  "MA":[-6.8,31.8],"DK-DK1":[9.4,56.0],"DK-DK2":[12.0,55.5],
  "SE-SE1":[20.0,67.0],"SE-SE2":[17.5,64.0],"SE-SE3":[17.5,60.0],"SE-SE4":[14.0,56.5],
  "NO-NO1":[10.0,59.5],"NO-NO2":[7.0,60.5],"NO-NO3":[11.0,63.5],
  "NO-NO4":[17.0,68.0],"NO-NO5":[6.0,62.0],
};

// Cubic ease-out
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

type ZoneData  = { intensity: number | null };
type TooltipSt = { x: number; y: number; key: string; intensity: number | null };

// ── Component ─────────────────────────────────────────────────────────────────
export function ZoneMap() {
  const router = useRouter();

  // Zoom is the live value passed to ZoomableGroup.
  // zoomRef tracks the "source of truth" so the RAF animation can read
  // the current value without a stale closure.
  const [zoom,   setZoom]   = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 10]);
  const zoomRef = useRef(1);
  const rafRef  = useRef<number | null>(null);

  const [zones,    setZones]    = useState<Record<string, ZoneData>>({});
  const [loading,  setLoading]  = useState(true);
  const [progress, setProgress] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [tooltip,  setTooltip]  = useState<TooltipSt | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Data fetch — single bulk request instead of 70+ individual calls ─────
  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 15_000);

    setProgress(0);
    setFetchError(false);
    setZones({});

    // Animate toward 85% while the request is in-flight.
    // Each tick closes 8% of the remaining gap, so the bar slows
    // naturally as it approaches the cap without ever reaching it.
    const progressInterval = setInterval(() => {
      setProgress((p) => p + (85 - p) * 0.08);
    }, 150);

    fetch("/api/zones/intensity/bulk", { signal: ac.signal })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Bulk fetch failed: ${r.status}`);
        }
        return r.json() as Promise<Record<string, number | null>>;
      })
      .then((data: Record<string, number | null>) => {
        if (cancelled) return;
        clearInterval(progressInterval);
        const mapped: Record<string, ZoneData> = {};
        for (const key of Object.keys(ZONE_CENTROIDS)) {
          mapped[key] = { intensity: data[key] ?? null };
        }
        setProgress(100);
        setZones(mapped);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        clearInterval(progressInterval);
        setZones({});
        setFetchError(true);
        setLoading(false);
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      cancelled = true;
      clearInterval(progressInterval);
      ac.abort();
      clearTimeout(timeoutId);
    };
  }, [retryCount]);

  // ── Smooth button zoom via RAF + cubic ease-out ───────────────────────────
  function animateTo(target: number) {
    target = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, target));
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const startZoom = zoomRef.current;
    const startTime = performance.now();

    function step(now: number) {
      const t       = Math.min((now - startTime) / ANIM_MS, 1);
      const eased   = easeOutCubic(t);
      const newZoom = startZoom + (target - startZoom) * eased;
      zoomRef.current = newZoom;
      setZoom(newZoom);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    }
    rafRef.current = requestAnimationFrame(step);
  }

  const zoomIn    = () => animateTo(zoomRef.current * ZOOM_STEP);
  const zoomOut   = () => animateTo(zoomRef.current / ZOOM_STEP);
  const zoomReset = () => { animateTo(1); setCenter([0, 10]); };

  // When d3-zoom handles trackpad/scroll, sync back to our refs
  function handleMoveEnd({ coordinates, zoom: z }: { coordinates: [number, number]; zoom: number }) {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    zoomRef.current = z;
    setZoom(z);
    setCenter(coordinates);
  }

  const handleMarkerClick = useCallback(
    (key: string) => router.push(`/z/${encodeURIComponent(key)}`),
    [router],
  );

  const showTooltipAtElement = useCallback(
    (el: Element, key: string, intensity: number | null) => {
      const rect = el.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top,
        key,
        intensity,
      });
    },
    [],
  );

  return (
    <div className={styles.wrap}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingInner}>
            <span className={styles.loadingText}>Loading live intensities… {Math.round(progress)}%</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
      {fetchError && !loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingInner}>
            <span className={styles.loadingText}>Failed to load intensity data.</span>
            <button
              className={styles.ctrlBtn}
              style={{ marginTop: "0.75rem" }}
              onClick={() => { setFetchError(false); setLoading(true); setProgress(0); setRetryCount((n) => n + 1); }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className={styles.controls}>
        <button className={styles.ctrlBtn} onClick={zoomIn}    aria-label="Zoom in">+</button>
        <button className={styles.ctrlBtn} onClick={zoomOut}   aria-label="Zoom out">−</button>
        <button className={styles.ctrlBtn} onClick={zoomReset} aria-label="Reset view" style={{ fontSize: "0.7rem" }}>⌂</button>
      </div>

      {/* Map */}
      <div className={styles.mapContainer}>
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{ scale: 153, center: [0, 10] }}
          style={{ width: "100%", height: "100%", background: "transparent" }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onMoveEnd={handleMoveEnd}
          >
            <Graticule stroke="rgba(255,255,255,0.03)" strokeWidth={0.4} />
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#0d2540"
                    stroke="#1a4060"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {Object.keys(ZONE_CENTROIDS).map((key) => {
              const status  = zones[key];
              const hasData = status?.intensity != null;
              const color   = intensityColor(status?.intensity ?? null);
              const r       = Math.max(1.5, 4 / Math.sqrt(zoom));
              return (
                <Marker
                  key={key}
                  coordinates={ZONE_CENTROIDS[key]}
                  onClick={() => handleMarkerClick(key)}
                  onMouseEnter={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, key, intensity: status?.intensity ?? null })
                  }
                  onMouseMove={(e) =>
                    setTooltip((p) => (p?.key === key ? { ...p, x: e.clientX, y: e.clientY } : p))
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: "pointer" }}
                >
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={`${getZoneName(key)} (${key}), ${!hasData ? "no live data" : `${status!.intensity} grams CO2 per kilowatt-hour`}`}
                    onFocus={(e: FocusEvent<SVGGElement>) => {
                      showTooltipAtElement(e.currentTarget, key, status?.intensity ?? null);
                    }}
                    onBlur={() => setTooltip(null)}
                    onKeyDown={(e: KeyboardEvent<SVGGElement>) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleMarkerClick(key);
                      }
                    }}
                  >
                    {/* Subtle pulse ring — live zones only, disabled for prefers-reduced-motion */}
                    {hasData && !reducedMotion && (
                      <circle r={r} fill={color} opacity={0}>
                        <animate attributeName="r" values={`${r};${r * 2.8};${r}`} dur="4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.22;0;0.22" dur="4s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle r={r * 2.2} fill={color} opacity={hasData ? 0.18 : 0.06} />
                    <circle r={r} fill={color} opacity={hasData ? 1 : 0.35} stroke="#040e1c" strokeWidth={0.8} />
                  </g>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Rich tooltip */}
      {tooltip && (() => {
        const color   = intensityColor(tooltip.intensity);
        const label   = intensityLabel(tooltip.intensity);
        const name    = getZoneName(tooltip.key);
        const country = getCountryName(tooltip.key);
        const hasData = tooltip.intensity != null;
        return (
          <div
            className={styles.tooltip}
            style={{ left: tooltip.x, top: tooltip.y - 16, transform: "translate(-50%, -100%)" }}
          >
            <div className={styles.tooltipHeader}>
              <span className={styles.tooltipCode}>{tooltip.key}</span>
              {name !== tooltip.key && <span className={styles.tooltipName}>{name}</span>}
              {country && name !== country && <span className={styles.tooltipCountry}>{country}</span>}
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
                  <span style={{ width:6, height:6, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0 }} />
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
