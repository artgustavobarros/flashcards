# Daruma

Flashcards with FSRS-6 scheduling. pnpm monorepo:

- `apps/web`: TanStack Start in SPA mode (Router + Query, React, Tailwind v4, shadcn/ui, TanStack Form). Dev server on port 3000.
- `apps/api`: NestJS + Drizzle on Postgres 17. Dev server on port 3001, every route under `/api`.
- `packages/shared`: zod schemas and types used by both apps.

The web app always calls `/api/...` on its own origin. In dev, Vite proxies `/api` to Nest (`API_ORIGIN`, default `http://localhost:3001`). In production, Traefik does the same.

Environment variables are validated with t3-env: `apps/api/src/env.ts` for the API, `apps/web/vite.config.ts` for the dev server.

## Local setup

Requires Node 24, pnpm 11 and Docker.

```sh
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm db:up   # Postgres 17 from compose.yaml
pnpm dev     # shared (watch) + api + web
```

Open http://localhost:3000. The page calls `GET /api/health` and shows whether the API and the database answered.

## Scripts

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `pnpm dev`       | Builds `shared`, then runs all three in watch |
| `pnpm build`     | Builds every package                          |
| `pnpm typecheck` | Runs `tsc --noEmit` in every package          |
| `pnpm check`     | Lints and checks formatting (Ultracite/Biome) |
| `pnpm fix`       | Applies safe lint fixes and formats           |
| `pnpm db:up`     | Starts Postgres and waits until it is healthy |
| `pnpm db:down`   | Stops Postgres (the volume is kept)           |

UI components come from shadcn: `pnpm dlx shadcn@latest add <name> -c apps/web`. They land in `apps/web/src/components/ui`, which the linter skips.

CI (`.github/workflows/ci.yml`) runs `check`, `typecheck` and `build` on every push to `master` and every pull request.

Drizzle commands run from `apps/api`: `pnpm --filter @daruma/api db:generate`, `db:migrate`, `db:studio`.
