# Carbon grid

Web app for grid carbon intensity using the [Electricity Maps API](https://static.electricitymaps.com/api/docs/index.html). Stack: **Next.js** (App Router, Route Handlers), **CSS Modules**, **PostgreSQL** via **Prisma**, **Redis** for caching, **Docker Compose** for local infrastructure and optional production-style app container.

## Prerequisites

- Node.js 20+
- Docker Desktop (or Docker Engine + Compose)

## First-time setup

1. Copy environment defaults and add your Electricity Maps token when you have one:

   ```bash
   cp .env.example .env
   ```

2. Start Postgres and Redis:

   ```bash
   docker compose up -d
   ```

3. Install dependencies and apply the Prisma schema to the database:

   ```bash
   npm install
   npx prisma db push
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Use [http://localhost:3000/api/health](http://localhost:3000/api/health) to confirm Postgres and Redis.

## Logs

Server-side `console.log` / `console.warn` calls are included on the home page render, health route, Redis client, cache helpers, Electricity Maps helper, and `src/instrumentation.ts` so you can trace wiring in the terminal during development.

## Optional: run the app in Docker

After `npx prisma db push` has been run at least once against the Compose Postgres instance (same as local dev), you can build and run the Next.js production image with databases:

```bash
docker compose --profile app up --build
```

The `web` service listens on port **3000** and uses the `DATABASE_URL` / `REDIS_URL` values defined for Docker in `docker-compose.yml`. Set `ELECTRICITY_MAPS_API_TOKEN` in your shell or a `.env` file next to compose when using the `app` profile.

## Project layout

- `src/app` — App Router pages and API routes
- `src/lib` — Prisma client, Redis client, cache helpers, Electricity Maps URL/header helpers
- `prisma/schema.prisma` — Postgres schema (starter `GridSnapshot` model for persisted API payloads)
- `docker-compose.yml` — Postgres, Redis, and optional `web` (profile `app`)
- `Dockerfile` — multi-stage production build with Next.js `standalone` output
