import { NextRequest, NextResponse } from "next/server";
import {
  flattenZonesCatalog,
  searchZones,
} from "@/lib/zonesCatalog";
import zoneNames from "@/lib/zone_names.json";

const MIN_QUERY_LEN = 2;
const MAX_RESULTS = 25;

const catalog = (zoneNames as { zoneShortName: Record<string, unknown> })
  .zoneShortName;
const rows = flattenZonesCatalog(catalog);
console.log("[api/zones/search] static catalog loaded", { zoneCount: rows.length });

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  console.log("[api/zones/search] GET", { q: q.slice(0, 40), len: q.length });
  if (q.length < MIN_QUERY_LEN) {
    return NextResponse.json({ zones: [] });
  }
  const zones = searchZones(rows, q, MAX_RESULTS);
  return NextResponse.json({ zones });
}
