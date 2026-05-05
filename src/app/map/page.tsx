import Link from "next/link";
import { EnergyGrid } from "@/components/EnergyGrid";
import { ZoneMap } from "@/components/ZoneMap";
import styles from "./map.module.css";

const LEGEND = [
  { color: "#3ddc97", label: "Very low",  range: "< 100"   },
  { color: "#7bdf5a", label: "Low",       range: "100–200" },
  { color: "#f5c842", label: "Moderate",  range: "200–350" },
  { color: "#f58642", label: "High",      range: "350–500" },
  { color: "#f54242", label: "Very high", range: "> 500"   },
  { color: "#4b5563", label: "No data",   range: ""        },
];

export default function MapPage() {
  return (
    <div className={styles.page}>
      <EnergyGrid />

      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <Link href="/" className={styles.back}>← Back</Link>
          <div className={styles.heroText}>
            <h1 className={styles.heading}>Global Carbon Map</h1>
            <p className={styles.subheading}>
              Live CO₂ intensity across 70+ power grid zones
            </p>
          </div>
        </div>

        <div className={styles.heroRight}>
          <span className={styles.live}>
            <span className={styles.liveDot} />
            Live
          </span>
          <div className={styles.legend}>
            {LEGEND.map((l) => (
              <span key={l.label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: l.color }} />
                <span className={styles.legendLabel}>{l.label}</span>
                {l.range && <span className={styles.legendRange}>{l.range}</span>}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <ZoneMap />
      </main>
    </div>
  );
}
