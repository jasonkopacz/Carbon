"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentZones, type RecentZone } from "./ZoneTracker";
import styles from "./RecentZones.module.css";

const STORAGE_KEY = "carbon:favorites";

function getFavoriteKeys(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function RecentZones() {
  const [recents, setRecents] = useState<RecentZone[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    function load() {
      setRecents(getRecentZones());
      setFavorites(getFavoriteKeys());
    }
    load();
    window.addEventListener("carbon:favorites-changed", load);
    return () => window.removeEventListener("carbon:favorites-changed", load);
  }, []);

  const favZones = recents.filter((z) => favorites.includes(z.key));
  const recentOnly = recents.filter((z) => !favorites.includes(z.key));

  if (recents.length === 0) return null;

  return (
    <div className={styles.wrap}>
      {favZones.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.heading}>
            <span className={styles.headingIcon}>★</span> Saved zones
          </h2>
          <div className={styles.chips}>
            {favZones.map((z) => (
              <ZoneChip key={z.key} zone={z} isFav />
            ))}
          </div>
        </section>
      )}
      {recentOnly.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.heading}>Recently viewed</h2>
          <div className={styles.chips}>
            {recentOnly.map((z) => (
              <ZoneChip key={z.key} zone={z} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ZoneChip({ zone, isFav }: { zone: RecentZone; isFav?: boolean }) {
  return (
    <Link
      href={`/z/${encodeURIComponent(zone.key)}`}
      className={`${styles.chip} ${isFav ? styles.favChip : ""}`}
    >
      <span className={styles.chipCode}>{zone.key}</span>
      <span className={styles.chipName}>{zone.name}</span>
    </Link>
  );
}
