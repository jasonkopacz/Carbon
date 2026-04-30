export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  if (process.env.NODE_ENV === "development") {
    console.log("[instrumentation] register start");
  }
  try {
    const { prisma } = await import("./lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    if (process.env.NODE_ENV === "development") {
      console.log("[instrumentation] prisma reachable");
    }
  } catch (err) {
    console.warn(
      "[instrumentation] prisma check failed (is Postgres up and DATABASE_URL set?)",
      err,
    );
  }
  try {
    const { redis } = await import("./lib/redis");
    const pong = await redis.ping();
    if (process.env.NODE_ENV === "development") {
      console.log("[instrumentation] redis reachable", { pong });
    }
  } catch (err) {
    console.warn(
      "[instrumentation] redis check failed (is Redis up and REDIS_URL set?)",
      err,
    );
  }
}
