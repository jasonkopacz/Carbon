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
