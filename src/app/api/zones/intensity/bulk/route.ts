import { NextResponse } from "next/server";
import { getApiToken, getCarbonIntensity } from "@/lib/electricityMaps";

// All zones shown on the global map — fetch them all server-side in one request
const ALL_ZONES = [
  "DE","FR","GB","ES","IT","PL","NL","BE","SE","NO","FI","DK",
  "AT","CH","PT","CZ","HU","RO","GR","BG","SK","HR","RS","SI",
  "US-CAL-CISO","US-TEX-ERCO","US-NY-NYIS","US-MIDA-PJM","US-MIDW-MISO",
  "US-NW-PACW","US-SE-SERC","US-NE-ISNE","US-SW-SRP",
  "CA-ON","CA-QC","CA-BC","CA-AB","CA-SK","CA-MB",
  "JP-TK","JP-KN","JP-CB","JP-TH","JP-HKD","JP-KY",
  "AU-NSW","AU-VIC","AU-QLD","AU-SA","AU-WA",
  "IN-NO","IN-SO","IN-WE","IN-EA",
  "CN","KR","TW",
  "BR-CS","BR-N","BR-NE","BR-S","AR","CL",
  "ZA","NG","KE","EG","MA",
  "DK-DK1","DK-DK2",
  "SE-SE1","SE-SE2","SE-SE3","SE-SE4",
  "NO-NO1","NO-NO2","NO-NO3","NO-NO4","NO-NO5",
];

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getApiToken();

  // Fetch all zones in parallel server-side
  const results = await Promise.allSettled(
    ALL_ZONES.map((zone) => getCarbonIntensity(zone, token)),
  );

  const data: Record<string, number | null> = {};
  ALL_ZONES.forEach((zone, i) => {
    const result = results[i];
    data[zone] = result.status === "fulfilled" ? (result.value?.carbonIntensity ?? null) : null;
  });

  return NextResponse.json(data, {
    headers: {
      // Cache for 5 minutes at the edge, serve stale for up to 10 more
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
