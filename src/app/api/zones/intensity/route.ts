import { NextRequest, NextResponse } from "next/server";
import { getApiToken, getCarbonIntensity } from "@/lib/electricityMaps";

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get("zone")?.trim() ?? "";
  if (!zone) return NextResponse.json({ error: "zone required" }, { status: 400 });

  const token = await getApiToken();
  const data = await getCarbonIntensity(zone, token);
  if (!data) return NextResponse.json({ carbonIntensity: null });
  return NextResponse.json({ carbonIntensity: data.carbonIntensity });
}
