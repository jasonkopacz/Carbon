import { Suspense } from "react";
import Link from "next/link";
import { EnergyGrid } from "@/components/EnergyGrid";
import { HistoryChart } from "@/components/HistoryChart";
import { DonutChart } from "@/components/DonutChart";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ZoneTracker } from "@/components/ZoneTracker";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  getApiToken,
  getCarbonIntensity,
  getPowerBreakdown,
  getCarbonIntensityHistory,
  getCarbonIntensityForecast,
  type PowerSources,
} from "@/lib/electricityMaps";
import zoneNamesJson from "@/lib/zone_names.json";
import styles from "./zonePage.module.css";
import loadingStyles from "./loading.module.css";

type Props = { params: Promise<{ zoneKey: string }> };

// ── Zone catalog lookup ───────────────────────────────────────────────────────

const catalog = (
  zoneNamesJson as {
    zoneShortName: Record<
      string,
      { zoneName?: string; countryName?: string; displayName?: string }
    >;
  }
).zoneShortName;

function getZoneInfo(key: string) {
  const entry = catalog[key];
  if (!entry) return { displayName: key, countryName: null };
  const displayName = entry.displayName ?? entry.zoneName ?? key;
  return { displayName, countryName: entry.countryName ?? null };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function intensityLabel(v: number) {
  if (v < 100) return { text: "Very Low", cls: "veryLow" };
  if (v < 200) return { text: "Low", cls: "low" };
  if (v < 350) return { text: "Moderate", cls: "moderate" };
  if (v < 500) return { text: "High", cls: "high" };
  return { text: "Very High", cls: "veryHigh" };
}

function fmtMW(mw: number | null): string {
  if (mw == null) return "—";
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  return `${Math.round(mw)} MW`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const SOURCE_META: Record<
  string,
  { label: string; color: string; renewable: boolean }
> = {
  solar:               { label: "Solar",           color: "#fbbf24", renewable: true  },
  wind:                { label: "Wind",            color: "#3ddc97", renewable: true  },
  hydro:               { label: "Hydro",           color: "#60a5fa", renewable: true  },
  "hydro discharge":   { label: "Hydro Discharge", color: "#93c5fd", renewable: true  },
  nuclear:             { label: "Nuclear",         color: "#a78bfa", renewable: false },
  geothermal:          { label: "Geothermal",      color: "#fb7185", renewable: true  },
  biomass:             { label: "Biomass",         color: "#86efac", renewable: true  },
  gas:                 { label: "Gas",             color: "#f97316", renewable: false },
  coal:                { label: "Coal",            color: "#9ca3af", renewable: false },
  oil:                 { label: "Oil",             color: "#92400e", renewable: false },
  "battery discharge": { label: "Battery",         color: "#c084fc", renewable: false },
  unknown:             { label: "Unknown",         color: "#4b5563", renewable: false },
};

const SOURCE_ORDER = [
  "solar", "wind", "hydro", "hydro discharge", "nuclear",
  "geothermal", "biomass", "gas", "coal", "oil", "battery discharge", "unknown",
];

function SourceBars({ breakdown, total }: { breakdown: PowerSources; total: number }) {
  const entries = SOURCE_ORDER.map((key) => ({
    key,
    value: breakdown[key as keyof PowerSources] ?? 0,
    meta: SOURCE_META[key] ?? { label: key, color: "#4b5563", renewable: false },
  })).filter((e) => (e.value ?? 0) > 0);

  if (entries.length === 0) return <p className={styles.noData}>No data available</p>;

  return (
    <div className={styles.sourceBars}>
      {entries.map((e) => {
        const pct = total > 0 ? (e.value / total) * 100 : 0;
        return (
          <div key={e.key} className={styles.sourceRow}>
            <div className={styles.sourceLabel}>
              <span className={styles.sourceDot} style={{ background: e.meta.color }} />
              <span className={styles.sourceName}>{e.meta.label}</span>
              {e.meta.renewable && <span className={styles.renewableBadge}>↻</span>}
            </div>
            <div className={styles.sourceBar}>
              <div className={styles.sourceBarFill} style={{ width: `${pct.toFixed(1)}%`, background: e.meta.color }} />
            </div>
            <span className={styles.sourceValue}>{fmtMW(e.value)}</span>
            <span className={styles.sourcePct}>{pct.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Skeleton for Suspense fallback ────────────────────────────────────────────

function DataSkeleton() {
  function Shimmer({ className }: { className?: string }) {
    return <div className={`${loadingStyles.shimmer} ${className ?? ""}`} />;
  }
  return (
    <div className={styles.main}>
      <div className={loadingStyles.titleRow}>
        <div className={loadingStyles.titleBlock}>
          <Shimmer className={loadingStyles.kicker} />
          <Shimmer className={loadingStyles.title} />
          <Shimmer className={loadingStyles.subtitle} />
        </div>
        <Shimmer className={loadingStyles.badge} />
      </div>
      <div className={loadingStyles.statsRow}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={loadingStyles.statCard}>
            <Shimmer className={loadingStyles.statValue} />
            <Shimmer className={loadingStyles.statLabel} />
          </div>
        ))}
      </div>
      <Shimmer className={loadingStyles.wideCard} />
      <div className={loadingStyles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className={loadingStyles.card} />
        ))}
      </div>
    </div>
  );
}

// ── Inner data section (all async API work isolated here) ─────────────────────

async function ZoneDataSection({ zoneKey, token }: { zoneKey: string; token: string | undefined }) {
  const [ci, pb, history, forecast] = await Promise.all([
    getCarbonIntensity(zoneKey, token),
    getPowerBreakdown(zoneKey, token),
    getCarbonIntensityHistory(zoneKey, token),
    getCarbonIntensityForecast(zoneKey, token),
  ]);

  const { displayName, countryName } = getZoneInfo(zoneKey);
  const label = ci ? intensityLabel(ci.carbonIntensity) : null;

  return (
    <main className={styles.main}>
      {/* ── Zone title ── */}
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Grid zone</p>
          <h1 className={styles.title}>{zoneKey}</h1>
          {(displayName !== zoneKey || countryName) && (
            <p className={styles.zoneName}>
              {displayName !== zoneKey ? displayName : ""}
              {displayName !== zoneKey && countryName ? " · " : ""}
              {countryName ?? ""}
            </p>
          )}
          {ci && <p className={styles.updatedAt}>Updated {fmtTime(ci.updatedAt)}</p>}
        </div>
        {ci && label && (
          <div className={`${styles.intensityBadge} ${styles[label.cls]}`}>
            <span className={styles.intensityValue}>{ci.carbonIntensity}</span>
            <span className={styles.intensityUnit}>gCO₂eq/kWh</span>
            <span className={styles.intensityLabel}>{label.text}</span>
          </div>
        )}
      </div>

      {!ci && !pb && (
        <div className={styles.errorCard}>
          <p>No data returned for zone <strong>{zoneKey}</strong>. The zone may not be supported by your API tier.</p>
        </div>
      )}

      {/* ── Summary stats ── */}
      {pb && (
        <div className={styles.statsRow}>
          {[
            { value: `${pb.renewablePercentage}%`,       label: "Renewable"  },
            { value: `${pb.fossilFreePercentage}%`,      label: "Fossil-free"},
            { value: fmtMW(pb.powerConsumptionTotal),    label: "Consuming"  },
            { value: fmtMW(pb.powerProductionTotal),     label: "Producing"  },
            { value: fmtMW(pb.powerImportTotal),         label: "Importing"  },
            { value: fmtMW(pb.powerExportTotal),         label: "Exporting"  },
          ].map((s) => (
            <div key={s.label} className={styles.statCard}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.grid}>
        {/* ── Combined history + forecast chart ── */}
        {(history?.history.length ?? 0) > 0 && (
          <section className={`${styles.card} ${styles.cardWide}`}>
            <h2 className={styles.cardTitle}>
              Carbon intensity — past 24h
              {forecast?.forecast.length ? " + forecast" : ""}
            </h2>
            <HistoryChart
              history={history!.history}
              forecast={forecast?.forecast}
            />
            <div className={styles.historyLegend}>
              {[
                { label: "Very Low",  color: "#3ddc97", range: "< 100"   },
                { label: "Low",       color: "#7bdf5a", range: "100–200" },
                { label: "Moderate",  color: "#f5c842", range: "200–350" },
                { label: "High",      color: "#f58642", range: "350–500" },
                { label: "Very High", color: "#f54242", range: "> 500"   },
              ].map((l) => (
                <span key={l.label} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: l.color }} />
                  {l.label} <span className={styles.legendRange}>({l.range})</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Energy mix donut ── */}
        {pb && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Energy mix</h2>
            <DonutChart
              breakdown={pb.powerConsumptionBreakdown}
              total={pb.powerConsumptionTotal}
            />
          </section>
        )}

        {/* ── Consumption breakdown ── */}
        {pb && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Power consumption by source</h2>
            <SourceBars breakdown={pb.powerConsumptionBreakdown} total={pb.powerConsumptionTotal} />
          </section>
        )}

        {/* ── Production breakdown ── */}
        {pb && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Power production by source</h2>
            <SourceBars breakdown={pb.powerProductionBreakdown} total={pb.powerProductionTotal} />
          </section>
        )}

        {/* ── Imports ── */}
        {pb && Object.keys(pb.powerImportBreakdown).length > 0 && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Imports by zone</h2>
            <div className={styles.flowList}>
              {Object.entries(pb.powerImportBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([zone, mw]) => (
                  <div key={zone} className={styles.flowRow}>
                    <Link href={`/z/${encodeURIComponent(zone)}`} className={styles.flowZone}>{zone}</Link>
                    <div className={styles.flowBar}>
                      <div className={styles.flowBarFill}
                        style={{ width: `${((mw / pb.powerImportTotal) * 100).toFixed(1)}%`, background: "#60a5fa" }} />
                    </div>
                    <span className={styles.flowValue}>{fmtMW(mw)}</span>
                    <span className={styles.flowPct}>{((mw / pb.powerImportTotal) * 100).toFixed(0)}%</span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* ── Exports ── */}
        {pb && Object.keys(pb.powerExportBreakdown).length > 0 && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Exports by zone</h2>
            <div className={styles.flowList}>
              {Object.entries(pb.powerExportBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([zone, mw]) => (
                  <div key={zone} className={styles.flowRow}>
                    <Link href={`/z/${encodeURIComponent(zone)}`} className={styles.flowZone}>{zone}</Link>
                    <div className={styles.flowBar}>
                      <div className={styles.flowBarFill}
                        style={{ width: `${((mw / pb.powerExportTotal) * 100).toFixed(1)}%`, background: "#f97316" }} />
                    </div>
                    <span className={styles.flowValue}>{fmtMW(mw)}</span>
                    <span className={styles.flowPct}>{((mw / pb.powerExportTotal) * 100).toFixed(0)}%</span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* ── Metadata ── */}
        {ci && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Metadata</h2>
            <dl className={styles.metaList}>
              {[
                { dt: "Zone",               dd: ci.zone                   },
                { dt: "Measurement time",   dd: fmtTime(ci.datetime)      },
                { dt: "Last updated",       dd: fmtTime(ci.updatedAt)     },
                { dt: "Emission factor",    dd: ci.emissionFactorType      },
                ...(ci.temporalGranularity
                  ? [{ dt: "Granularity",   dd: ci.temporalGranularity }]
                  : []),
                { dt: "Estimated",          dd: ci.isEstimated ? "Yes" : "No" },
                ...(ci.estimationMethod
                  ? [{ dt: "Estimation method", dd: ci.estimationMethod }]
                  : []),
              ].map(({ dt, dd }) => (
                <div key={dt} className={styles.metaRow}>
                  <dt>{dt}</dt>
                  <dd>{dd}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </main>
  );
}

// ── Outer shell ───────────────────────────────────────────────────────────────
// Reads params + token here (outside Suspense) so cookies() is never called
// inside a Suspense-wrapped async component, which breaks React 19 streaming.

export default async function ZonePage({ params }: Props) {
  // Await both in parallel — neither depends on the other
  const [{ zoneKey: raw }, token] = await Promise.all([params, getApiToken()]);
  const zoneKey = decodeURIComponent(raw);
  const { displayName, countryName } = getZoneInfo(zoneKey);
  const pageTitle = displayName !== zoneKey
    ? `${displayName}${countryName ? `, ${countryName}` : ""}`
    : zoneKey;

  return (
    <div className={styles.page}>
      <EnergyGrid />
      <AutoRefresh />
      <ZoneTracker zoneKey={zoneKey} zoneName={pageTitle} />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.back}>← Back to search</Link>
          <Link href="/map" className={styles.mapLink}>🗺 Global map</Link>
        </div>
        <div className={styles.headerRight}>
          <FavoriteButton zoneKey={zoneKey} zoneName={pageTitle} />
        </div>
      </header>

      <Suspense fallback={<DataSkeleton />}>
        <ZoneDataSection zoneKey={zoneKey} token={token} />
      </Suspense>
    </div>
  );
}
