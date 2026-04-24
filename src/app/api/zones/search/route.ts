import { NextRequest, NextResponse } from "next/server";
import { getCacheJson, setCacheJson } from "@/lib/cache";
import { electricityMapsHeaders, electricityMapsUrl } from "@/lib/electricityMaps";
import {
  flattenZonesCatalog,
  searchZones,
} from "@/lib/zonesCatalog";

const CACHE_KEY = "em:v3:zones:catalog";
const CACHE_TTL_SEC = 86_400;
const MIN_QUERY_LEN = 2;
const MAX_RESULTS = 25;

async function loadCatalog(): Promise<Record<string, unknown>> {
  try {
    const cached = await getCacheJson<Record<string, unknown>>(CACHE_KEY);
    if (cached) {
      console.log("[api/zones/search] redis cache hit");
      return cached;
    }
  } catch (err) {
    console.warn("[api/zones/search] redis read skipped", err);
  }

  const url = electricityMapsUrl("/zones");
  const res = await fetch(url, { headers: electricityMapsHeaders() });
  if (!res.ok) {
    console.warn("[api/zones/search] upstream error", {
      status: res.status,
    });
    throw new Error(`zones HTTP ${res.status}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  try {
    await setCacheJson(CACHE_KEY, data, CACHE_TTL_SEC);
    console.log("[api/zones/search] redis cache set", {
      keys: Object.keys(data).length,
    });
  } catch (err) {
    console.warn("[api/zones/search] redis write skipped", err);
  }
  return data;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  console.log("[api/zones/search] GET", { q: q.slice(0, 40), len: q.length });
  if (q.length < MIN_QUERY_LEN) {
    return NextResponse.json({ zones: [] });
  }
  try {
    const catalog = await loadCatalog();
    const rows = flattenZonesCatalog(catalog);
    const zones = searchZones(rows, q, MAX_RESULTS);
    return NextResponse.json({ zones });
  } catch {
    return NextResponse.json(
      { error: "Could not load zones from Electricity Maps." },
      { status: 502 },
    );
  }
}
