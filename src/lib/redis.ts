import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function isTcpRedisUrl(url: string | undefined): url is string {
  const u = url?.trim();
  return !!u && (u.startsWith("redis://") || u.startsWith("rediss://"));
}

function resolveRedisUrl(): string {
  for (const raw of [process.env.REDIS_URL, process.env.UPSTASH_REDIS_REST_URL]) {
    if (isTcpRedisUrl(raw)) return raw.trim();
  }
  if (
    process.env.NODE_ENV === "development" &&
    process.env.UPSTASH_REDIS_REST_URL?.trim()?.startsWith("http")
  ) {
    console.warn(
      "[redis] UPSTASH_REDIS_REST_URL is REST (HTTPS); ioredis needs REDIS_URL as redis:// or rediss://. Using redis://127.0.0.1:6379",
    );
  }
  return "redis://127.0.0.1:6379";
}

function createRedis(): Redis {
  const url = resolveRedisUrl();
  const safeUrl = url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
  if (process.env.NODE_ENV === "development") console.log("[redis] createRedis", { url: safeUrl });
  return new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
