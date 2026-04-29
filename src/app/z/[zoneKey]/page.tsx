import Link from "next/link";
import { EnergyGrid } from "@/components/EnergyGrid";
import { HistoryChart } from "@/components/HistoryChart";
import {
  getCarbonIntensity,
  getPowerBreakdown,
  getCarbonIntensityHistory,
  type PowerSources,
} from "@/lib/electricityMaps";
import styles from "./zonePage.module.css";

type Props = { params: Promise<{ zoneKey: string }> };

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
  solar:            { label: "Solar",            color: "#fbbf24", renewable: true  },
  wind:             { label: "Wind",             color: "#3ddc97", renewable: true  },
  hydro:            { label: "Hydro",            color: "#60a5fa", renewable: true  },
  "hydro discharge":{ label: "Hydro Discharge",  color: "#93c5fd", renewable: true  },
  nuclear:          { label: "Nuclear",          color: "#a78bfa", renewable: false },
  geothermal:       { label: "Geothermal",       color: "#fb7185", renewable: true  },
  biomass:          { label: "Biomass",          color: "#86efac", renewable: true  },
  gas:              { label: "Gas",              color: "#f97316", renewable: false },
  coal:             { label: "Coal",             color: "#9ca3af", renewable: false },
  oil:              { label: "Oil",              color: "#78350f", renewable: false },
  "battery discharge":{ label: "Battery",        color: "#c084fc", renewable: false },
  unknown:          { label: "Unknown",          color: "#4b5563", renewable: false },
};

const SOURCE_ORDER = [
  "solar", "wind", "hydro", "hydro discharge", "nuclear",
  "geothermal", "biomass", "gas", "coal", "oil", "battery discharge", "unknown",
];

function SourceBars({
  breakdown,
  total,
}: {
  breakdown: PowerSources;
  total: number;
}) {
  const entries = SOURCE_ORDER.map((key) => ({
    key,
    value: breakdown[key as keyof PowerSources] ?? 0,
    meta: SOURCE_META[key] ?? { label: key, color: "#4b5563", renewable: false },
  })).filter((e) => e.value != null && e.value > 0);

  if (entries.length === 0) return <p className={styles.noData}>No data available</p>;

  return (
    <div className={styles.sourceBars}>
      {entries.map((e) => {
        const pct = total > 0 ? (e.value / total) * 100 : 0;
        return (
          <div key={e.key} className={styles.sourceRow}>
            <div className={styles.sourceLabel}>
              <span
                className={styles.sourceDot}
                style={{ background: e.meta.color }}
              />
              <span className={styles.sourceName}>{e.meta.label}</span>
              {e.meta.renewable && (
                <span className={styles.renewableBadge}>↻</span>
              )}
            </div>
            <div className={styles.sourceBar}>
              <div
                className={styles.sourceBarFill}
                style={{
                  width: `${pct.toFixed(1)}%`,
                  background: e.meta.color,
                }}
              />
            </div>
            <span className={styles.sourceValue}>{fmtMW(e.value)}</span>
            <span className={styles.sourcePct}>{pct.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ZonePage({ params }: Props) {
  const { zoneKey: raw } = await params;
  const zoneKey = decodeURIComponent(raw);
  console.log("[zone page] render", { zoneKey });

  const [ci, pb, history] = await Promise.all([
    getCarbonIntensity(zoneKey),
    getPowerBreakdown(zoneKey),
    getCarbonIntensityHistory(zoneKey),
  ]);

  const label = ci ? intensityLabel(ci.carbonIntensity) : null;

  return (
    <div className={styles.page}>
      <EnergyGrid />

      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← Back to search
        </Link>
        {ci?.isEstimated && (
          <span className={styles.estimatedBadge}>
            Sandbox / estimated data
          </span>
        )}
      </header>

      <main className={styles.main}>
        {/* ── Zone title ── */}
        <div className={styles.titleRow}>
          <div>
            <p className={styles.kicker}>Grid zone</p>
            <h1 className={styles.title}>{zoneKey}</h1>
            {ci && (
              <p className={styles.updatedAt}>
                Updated {fmtTime(ci.updatedAt)}
              </p>
            )}
          </div>
          {ci && label && (
            <div className={`${styles.intensityBadge} ${styles[label.cls]}`}>
              <span className={styles.intensityValue}>
                {ci.carbonIntensity}
              </span>
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
            <div className={styles.statCard}>
              <span className={styles.statValue}>{pb.renewablePercentage}%</span>
              <span className={styles.statLabel}>Renewable</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{pb.fossilFreePercentage}%</span>
              <span className={styles.statLabel}>Fossil-free</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{fmtMW(pb.powerConsumptionTotal)}</span>
              <span className={styles.statLabel}>Consuming</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{fmtMW(pb.powerProductionTotal)}</span>
              <span className={styles.statLabel}>Producing</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{fmtMW(pb.powerImportTotal)}</span>
              <span className={styles.statLabel}>Importing</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{fmtMW(pb.powerExportTotal)}</span>
              <span className={styles.statLabel}>Exporting</span>
            </div>
          </div>
        )}

        <div className={styles.grid}>
          {/* ── 24h history ── */}
          {history && history.history.length > 0 && (
            <section className={`${styles.card} ${styles.cardWide}`}>
              <h2 className={styles.cardTitle}>24-hour carbon intensity</h2>
              <HistoryChart history={history.history} />
              <div className={styles.historyLegend}>
                {[
                  { label: "Very Low", color: "#3ddc97", range: "< 100" },
                  { label: "Low",      color: "#7bdf5a", range: "100–200" },
                  { label: "Moderate", color: "#f5c842", range: "200–350" },
                  { label: "High",     color: "#f58642", range: "350–500" },
                  { label: "Very High",color: "#f54242", range: "> 500" },
                ].map((l) => (
                  <span key={l.label} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: l.color }} />
                    {l.label} <span className={styles.legendRange}>({l.range})</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Consumption breakdown ── */}
          {pb && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Power consumption by source</h2>
              <SourceBars
                breakdown={pb.powerConsumptionBreakdown}
                total={pb.powerConsumptionTotal}
              />
            </section>
          )}

          {/* ── Production breakdown ── */}
          {pb && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Power production by source</h2>
              <SourceBars
                breakdown={pb.powerProductionBreakdown}
                total={pb.powerProductionTotal}
              />
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
                      <Link href={`/z/${encodeURIComponent(zone)}`} className={styles.flowZone}>
                        {zone}
                      </Link>
                      <div className={styles.flowBar}>
                        <div
                          className={styles.flowBarFill}
                          style={{
                            width: `${((mw / pb.powerImportTotal) * 100).toFixed(1)}%`,
                            background: "#60a5fa",
                          }}
                        />
                      </div>
                      <span className={styles.flowValue}>{fmtMW(mw)}</span>
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
                      <Link href={`/z/${encodeURIComponent(zone)}`} className={styles.flowZone}>
                        {zone}
                      </Link>
                      <div className={styles.flowBar}>
                        <div
                          className={styles.flowBarFill}
                          style={{
                            width: `${((mw / pb.powerExportTotal) * 100).toFixed(1)}%`,
                            background: "#f97316",
                          }}
                        />
                      </div>
                      <span className={styles.flowValue}>{fmtMW(mw)}</span>
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
                <div className={styles.metaRow}>
                  <dt>Zone</dt>
                  <dd>{ci.zone}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>Measurement time</dt>
                  <dd>{fmtTime(ci.datetime)}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>Last updated</dt>
                  <dd>{fmtTime(ci.updatedAt)}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>Emission factor type</dt>
                  <dd>{ci.emissionFactorType}</dd>
                </div>
                {ci.temporalGranularity && (
                  <div className={styles.metaRow}>
                    <dt>Granularity</dt>
                    <dd>{ci.temporalGranularity}</dd>
                  </div>
                )}
                <div className={styles.metaRow}>
                  <dt>Estimated</dt>
                  <dd>{ci.isEstimated ? "Yes" : "No"}</dd>
                </div>
                {ci.estimationMethod && (
                  <div className={styles.metaRow}>
                    <dt>Estimation method</dt>
                    <dd>{ci.estimationMethod}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
