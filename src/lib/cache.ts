import { getRedis } from "./redis";

export async function getCacheJson<T>(key: string): Promise<T | null> {
  if (process.env.NODE_ENV === "development") console.log("[cache] get", { key });
  const redis = getRedis();
  if (!redis) return null;
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
  if (process.env.NODE_ENV === "development") console.log("[cache] set", { key, ttlSeconds });
  const redis = getRedis();
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
