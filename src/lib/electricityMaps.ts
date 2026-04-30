import { cookies } from "next/headers";

const BASE = "https://api.electricitymaps.com/v3";

// Call this ONCE per request (top of a server component) to avoid multiple
// concurrent cookies() reads, which breaks React 19 Suspense streaming.
export async function getApiToken(): Promise<string | undefined> {
  try {
    const jar = await cookies();
    const cookieToken = jar.get("em_token")?.value;
    if (cookieToken) return cookieToken;
  } catch {
    // cookies() throws outside request context (e.g. build time)
  }
  const envToken = process.env.ELECTRICITY_MAPS_API_TOKEN;
  if (!envToken) {
    console.warn("[electricityMaps] no API token configured");
  }
  return envToken;
}

function makeHeaders(token: string | undefined): HeadersInit {
  if (!token) return {};
  return { "auth-token": token };
}

export function electricityMapsUrl(path: string) {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  console.log("[electricityMaps] url", { url });
  return url;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type CarbonIntensityLatest = {
  zone: string;
  carbonIntensity: number;
  datetime: string;
  updatedAt: string;
  emissionFactorType: string;
  isEstimated: boolean;
  estimationMethod: string | null;
  temporalGranularity?: string;
};

export type PowerSources = {
  nuclear: number | null;
  geothermal: number | null;
  biomass: number | null;
  coal: number | null;
  wind: number | null;
  solar: number | null;
  hydro: number | null;
  gas: number | null;
  oil: number | null;
  unknown: number | null;
  "hydro discharge": number | null;
  "battery discharge": number | null;
};

export type PowerBreakdownLatest = {
  zone: string;
  datetime: string;
  updatedAt: string;
  powerConsumptionBreakdown: PowerSources;
  powerProductionBreakdown: PowerSources;
  powerImportBreakdown: Record<string, number>;
  powerExportBreakdown: Record<string, number>;
  fossilFreePercentage: number;
  renewablePercentage: number;
  powerConsumptionTotal: number;
  powerProductionTotal: number;
  powerImportTotal: number;
  powerExportTotal: number;
  isEstimated: boolean;
  estimationMethod: string | null;
  temporalGranularity?: string;
};

export type CarbonIntensityHistoryPoint = {
  carbonIntensity: number;
  datetime: string;
};

export type CarbonIntensityHistory = {
  zone: string;
  history: CarbonIntensityHistoryPoint[];
};

export type CarbonIntensityForecast = {
  zone: string;
  forecast: CarbonIntensityHistoryPoint[];
};

// ── Fetchers (all accept an explicit token) ──────────────────────────────────

async function emFetch<T>(path: string, token: string | undefined): Promise<T | null> {
  try {
    const res = await fetch(electricityMapsUrl(path), {
      headers: makeHeaders(token),
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.error("[electricityMaps] fetch error", { path, status: res.status });
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.error("[electricityMaps] fetch threw", { path, error: String(e) });
    return null;
  }
}

export function getCarbonIntensity(zone: string, token: string | undefined) {
  return emFetch<CarbonIntensityLatest>(
    `/carbon-intensity/latest?zone=${encodeURIComponent(zone)}`,
    token,
  );
}

export function getPowerBreakdown(zone: string, token: string | undefined) {
  return emFetch<PowerBreakdownLatest>(
    `/power-breakdown/latest?zone=${encodeURIComponent(zone)}`,
    token,
  );
}

export function getCarbonIntensityHistory(zone: string, token: string | undefined) {
  return emFetch<CarbonIntensityHistory>(
    `/carbon-intensity/history?zone=${encodeURIComponent(zone)}`,
    token,
  );
}

export function getCarbonIntensityForecast(zone: string, token: string | undefined) {
  return emFetch<CarbonIntensityForecast>(
    `/carbon-intensity/forecast?zone=${encodeURIComponent(zone)}`,
    token,
  );
}
