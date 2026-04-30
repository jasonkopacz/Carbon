"use client";

import { useEffect } from "react";

export interface RecentZone {
  key: string;
  name: string;
  visitedAt: string;
}

const STORAGE_KEY = "carbon:recent";
const MAX_RECENT = 8;

export function saveRecentZone(key: string, name: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: RecentZone[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((z) => z.key !== key);
    const updated: RecentZone[] = [
      { key, name, visitedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable
  }
}

export function getRecentZones(): RecentZone[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface Props {
  zoneKey: string;
  zoneName: string;
}

export function ZoneTracker({ zoneKey, zoneName }: Props) {
  useEffect(() => {
    saveRecentZone(zoneKey, zoneName);
  }, [zoneKey, zoneName]);

  return null;
}
