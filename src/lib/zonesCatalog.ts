export type ZoneSearchResult = {
  zoneKey: string;
  zoneName: string;
  countryName: string | null;
  displayName: string | null;
};

type RawZone = {
  zoneKey?: string;
  zoneName?: string;
  countryName?: string;
  displayName?: string;
};

function toResult(key: string, raw: RawZone): ZoneSearchResult | null {
  const zoneKey = typeof raw.zoneKey === "string" ? raw.zoneKey : key;
  const zoneName = typeof raw.zoneName === "string" ? raw.zoneName : zoneKey;
  if (!zoneKey) {
    return null;
  }
  return {
    zoneKey,
    zoneName,
    countryName:
      typeof raw.countryName === "string" ? raw.countryName : null,
    displayName:
      typeof raw.displayName === "string" ? raw.displayName : null,
  };
}

export function flattenZonesCatalog(
  catalog: Record<string, unknown>,
): ZoneSearchResult[] {
  const out: ZoneSearchResult[] = [];
  for (const [key, value] of Object.entries(catalog)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }
    const row = toResult(key, value as RawZone);
    if (row) {
      out.push(row);
    }
  }
  return out;
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function searchHaystack(z: ZoneSearchResult): string {
  const parts = [
    z.zoneKey,
    z.zoneName,
    z.countryName,
    z.displayName,
  ].filter(Boolean) as string[];
  return normalize(parts.join(" "));
}

function rankMatch(z: ZoneSearchResult, needle: string): number {
  const k = normalize(z.zoneKey);
  const n = normalize(z.zoneName);
  if (k === needle) {
    return 0;
  }
  if (k.startsWith(needle)) {
    return 1;
  }
  if (n.startsWith(needle) || n.includes(` ${needle}`)) {
    return 2;
  }
  return 3;
}

export function searchZones(
  rows: ZoneSearchResult[],
  query: string,
  limit: number,
): ZoneSearchResult[] {
  const needle = normalize(query.trim());
  if (needle.length < 2) {
    return [];
  }
  const scored = rows
    .map((z) => {
      const hay = searchHaystack(z);
      if (!hay.includes(needle)) {
        return null;
      }
      return { z, rank: rankMatch(z, needle) };
    })
    .filter(Boolean) as { z: ZoneSearchResult; rank: number }[];

  scored.sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    return a.z.zoneName.localeCompare(b.z.zoneName);
  });

  return scored.slice(0, limit).map((s) => s.z);
}
