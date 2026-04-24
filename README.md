# Carbon grid

Web app for grid carbon intensity using the [Electricity Maps API](https://static.electricitymaps.com/api/docs/index.html). Stack: **Next.js** (App Router, Route Handlers), **CSS Modules**, **PostgreSQL** via **Prisma**, **Redis** for caching.

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ listening on your machine (e.g. [Postgres.app](https://postgresapp.com/), Homebrew `postgresql@16`, or another install)
- Redis (e.g. Homebrew `redis` or a managed instance); default URL is `redis://localhost:6379`

## First-time setup

1. Start PostgreSQL and create a database (connect with your usual admin role, often `postgres` or your macOS username):

   ```sql
   CREATE DATABASE carbon;
   ```

   Set `DATABASE_URL` in `.env` to a user that can create tables in that database, including a **password** in the URL (required by some local installs, e.g. Postgres.app over TCP). Example shape is in `.env.example`.

2. Copy env and fill in values:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies and apply the schema:

   ```bash
   npm install
   npx prisma db push
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Use [http://localhost:3000/api/health](http://localhost:3000/api/health) to confirm Postgres and Redis.

### Postgres.app (macOS)

If Prisma fails with **rejected "trust" authentication** or similar, Postgres.app is enforcing TCP rules for unknown clients. Use a `DATABASE_URL` that includes a **password**, and ensure that role exists with that password. See [Postgres.app permissions](https://postgresapp.com/l/app-permissions/).

## Logs

Server-side `console.log` / `console.warn` calls are included on the home page render, health route, Redis client, cache helpers, Electricity Maps helper, and `src/instrumentation.ts` so you can trace wiring in the terminal during development.

## Project layout

- `src/app` — App Router pages and API routes
- `src/lib` — Prisma client, Redis client, cache helpers, Electricity Maps URL/header helpers
- `prisma/schema.prisma` — Postgres schema (starter `GridSnapshot` model for persisted API payloads)
