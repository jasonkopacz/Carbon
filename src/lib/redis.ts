import { Redis } from "@upstash/redis";

type RedisSingleton = Redis | null | undefined;
const g = globalThis as unknown as { __carbon_redis?: RedisSingleton };

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^["']|["']$/g, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^["']|["']$/g, "");

  if (!url || !token) {
    if (process.env.NODE_ENV !== "development") {
      console.warn("[redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set; Redis disabled.");
    }
    return null;
  }

  console.log("[redis] connecting via Upstash HTTP client", { url });
  return new Redis({ url, token });
}

export function getRedis(): Redis | undefined {
  if (g.__carbon_redis !== undefined) {
    return g.__carbon_redis ?? undefined;
  }
  const client = createRedis();
  g.__carbon_redis = client;
  return client ?? undefined;
}
