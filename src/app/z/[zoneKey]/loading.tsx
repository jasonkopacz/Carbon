import styles from "./loading.module.css";

function Shimmer({ className }: { className?: string }) {
  return <div className={`${styles.shimmer} ${className ?? ""}`} />;
}

export default function ZoneLoading() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Shimmer className={styles.backBtn} />
      </div>

      <div className={styles.main}>
        {/* Title row */}
        <div className={styles.titleRow}>
          <div className={styles.titleBlock}>
            <Shimmer className={styles.kicker} />
            <Shimmer className={styles.title} />
            <Shimmer className={styles.subtitle} />
          </div>
          <Shimmer className={styles.badge} />
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.statCard}>
              <Shimmer className={styles.statValue} />
              <Shimmer className={styles.statLabel} />
            </div>
          ))}
        </div>

        {/* Wide chart card */}
        <Shimmer className={styles.wideCard} />

        {/* Two-column cards */}
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className={styles.card} />
          ))}
        </div>
      </div>
    </div>
  );
}
