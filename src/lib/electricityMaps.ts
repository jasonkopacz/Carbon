const BASE = "https://api.electricitymaps.com/v3";

export function electricityMapsHeaders(): HeadersInit {
  const token = process.env.ELECTRICITY_MAPS_API_TOKEN;
  if (!token) {
    console.warn(
      "[electricityMaps] ELECTRICITY_MAPS_API_TOKEN is not set; authenticated requests will fail",
    );
    return {};
  }
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

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function emFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(electricityMapsUrl(path), {
      headers: electricityMapsHeaders(),
      next: { revalidate: 300 }, // 5 min cache via Next.js fetch cache
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

export function getCarbonIntensity(zone: string) {
  return emFetch<CarbonIntensityLatest>(`/carbon-intensity/latest?zone=${encodeURIComponent(zone)}`);
}

export function getPowerBreakdown(zone: string) {
  return emFetch<PowerBreakdownLatest>(`/power-breakdown/latest?zone=${encodeURIComponent(zone)}`);
}

export function getCarbonIntensityHistory(zone: string) {
  return emFetch<CarbonIntensityHistory>(`/carbon-intensity/history?zone=${encodeURIComponent(zone)}`);
}
