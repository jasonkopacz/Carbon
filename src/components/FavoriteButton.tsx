"use client";

import { useEffect, useState } from "react";
import styles from "./FavoriteButton.module.css";

const STORAGE_KEY = "carbon:favorites";

function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setFavorites(keys: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

interface Props {
  zoneKey: string;
  zoneName: string;
}

export function FavoriteButton({ zoneKey, zoneName }: Props) {
  const [isFav, setIsFav] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsFav(getFavorites().includes(zoneKey));
  }, [zoneKey]);

  function toggle() {
    const current = getFavorites();
    let next: string[];
    if (current.includes(zoneKey)) {
      next = current.filter((k) => k !== zoneKey);
    } else {
      next = [zoneKey, ...current];
    }
    setFavorites(next);
    setIsFav(next.includes(zoneKey));
    // Dispatch so other components (homepage) can react
    window.dispatchEvent(new Event("carbon:favorites-changed"));
  }

  if (!mounted) return null;

  return (
    <button
      className={`${styles.btn} ${isFav ? styles.active : ""}`}
      onClick={toggle}
      aria-label={isFav ? `Remove ${zoneName} from favorites` : `Add ${zoneName} to favorites`}
      title={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {isFav ? "Saved" : "Save"}
    </button>
  );
}
