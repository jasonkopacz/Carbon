import Link from "next/link";
import { EnergyGrid } from "@/components/EnergyGrid";
import { ZoneMap } from "@/components/ZoneMap";
import styles from "./map.module.css";

export default function MapPage() {
  return (
    <div className={styles.page}>
      <EnergyGrid />
      <header className={styles.header}>
        <Link href="/" className={styles.back}>← Back</Link>
        <span className={styles.headerTitle}>Global zone map</span>
        <div className={styles.legend}>
          {[
            { color: "#3ddc97", label: "Very low (<100)" },
            { color: "#7bdf5a", label: "Low (100–200)" },
            { color: "#f5c842", label: "Moderate (200–350)" },
            { color: "#f58642", label: "High (350–500)" },
            { color: "#f54242", label: "Very high (>500)" },
            { color: "#4b5563", label: "No data" },
          ].map((l) => (
            <span key={l.label} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </header>
      <main className={styles.main}>
        <ZoneMap />
      </main>
    </div>
  );
}
