import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis(): Redis {
  const url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
  const safeUrl = url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
  console.log("[redis] createRedis", { url: safeUrl });
  return new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
