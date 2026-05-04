import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export async function GET() {
  if (process.env.NODE_ENV === "development") {
    console.log("[api/health] GET");
  }
  const checks: Record<string, string> = {};
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = "ok";
  } catch {
    checks.postgres = "error";
  }
  const redis = getRedis();
  if (!redis) {
    checks.redis = "skipped";
  } else {
    try {
      const pong = await redis.ping();
      checks.redis = pong === "PONG" ? "ok" : "unexpected";
    } catch {
      checks.redis = "error";
    }
  }
  const ok =
    checks.postgres === "ok" &&
    (checks.redis === "ok" || checks.redis === "skipped");
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
