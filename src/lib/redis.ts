import Redis, { type RedisOptions } from "ioredis";

const URL_ENV_KEYS = [
  "REDIS_URL",
  "KV_URL",
] as const;

type RedisSingleton = Redis | null | undefined;
const g = globalThis as unknown as { __carbon_redis?: RedisSingleton };

function tcpRedisUrlToOptions(urlStr: string): RedisOptions {
  const u = new URL(urlStr);
  const useTls = u.protocol === "rediss:";
  const port = u.port ? Number.parseInt(u.port, 10) : 6379;
  const opts: RedisOptions = {
    host: u.hostname,
    port,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  };
  if (u.username) {
    opts.username = u.username;
  }
  if (u.password !== "") {
    opts.password = u.password;
  }
  if (useTls) {
    opts.tls = {};
  }
  if (u.pathname.length > 1) {
    const db = Number.parseInt(u.pathname.slice(1), 10);
    if (!Number.isNaN(db)) {
      opts.db = db;
    }
  }
  return opts;
}

function isTcpRedisUrl(url: string | undefined): url is string {
  const raw = url?.trim().replace(/^["']|["']$/g, "");
  if (
    !raw ||
    (!raw.startsWith("redis://") && !raw.startsWith("rediss://"))
  ) {
    return false;
  }
  try {
    const u = new URL(raw);
    return u.hostname.length > 0;
  } catch {
    return false;
  }
}

function resolveRedisUrl(): string | null {
  for (const key of URL_ENV_KEYS) {
    const raw = process.env[key];
    if (isTcpRedisUrl(raw)) {
      console.log("[redis] using TCP URL from env", { key });
      return raw.trim().replace(/^["']|["']$/g, "");
    }
  }
  for (const key of URL_ENV_KEYS) {
    const raw = process.env[key]?.trim();
    if (raw && (raw.startsWith("redis://") || raw.startsWith("rediss://"))) {
      console.warn(
        "[redis] env has redis-style URL but invalid host (e.g. redis:///). Ignoring.",
        { key },
      );
    }
  }
  if (process.env.NODE_ENV === "development") {
    console.log("[redis] dev fallback", { url: "redis://127.0.0.1:6379" });
    return "redis://127.0.0.1:6379";
  }
  console.warn(
    "[redis] no valid redis:// or rediss:// URL in production; Redis disabled. Add REDIS_URL (TCP) from Upstash, or KV_URL if using Vercel KV.",
  );
  return null;
}

function createRedis(url: string): Redis {
  const opts = tcpRedisUrlToOptions(url);
  console.log("[redis] createRedis", {
    host: opts.host,
    port: opts.port,
    tls: Boolean(opts.tls),
  });
  const client = new Redis(opts);
  client.on("error", (err) => {
    console.warn("[redis] client error", err.message);
  });
  return client;
}

export function getRedis(): Redis | undefined {
  if (g.__carbon_redis !== undefined) {
    return g.__carbon_redis ?? undefined;
  }
  const url = resolveRedisUrl();
  if (!url) {
    g.__carbon_redis = null;
    return undefined;
  }
  const client = createRedis(url);
  g.__carbon_redis = client;
  return client;
}
