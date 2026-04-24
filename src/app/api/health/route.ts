import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  console.log("[api/health] GET");
  const checks: Record<string, string> = {};
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = "ok";
  } catch {
    checks.postgres = "error";
  }
  try {
    const pong = await redis.ping();
    checks.redis = pong === "PONG" ? "ok" : "unexpected";
  } catch {
    checks.redis = "error";
  }
  const ok = checks.postgres === "ok" && checks.redis === "ok";
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
