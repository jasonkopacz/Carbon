import { redis } from "./redis";

export async function getCacheJson<T>(key: string): Promise<T | null> {
  console.log("[cache] get", { key });
  const raw = await redis.get(key);
  if (raw == null) {
    return null;
  }
  return JSON.parse(raw) as T;
}

export async function setCacheJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
) {
  console.log("[cache] set", { key, ttlSeconds });
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
