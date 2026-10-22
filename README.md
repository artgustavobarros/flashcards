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
cp apps/api/.env.example apps/api/.env   # then fill BETTER_AUTH_SECRET
pnpm db:up                                # Postgres 17 from compose.yaml
pnpm --filter @daruma/api db:migrate
pnpm dev                                  # shared (watch) + api + web
```

Open http://localhost:3000. Without a session you land on `/entrar`; "Entrar como dev" signs you in as `dev@daruma.local`.

## Auth

Better Auth runs inside Nest (`apps/api/src/auth`), mounted on `/api/auth`. The only real way in is Google: the first sign-in creates the account. Sessions are rows in Postgres behind an httpOnly cookie on the app's origin. Every Nest route needs a session unless it is marked `@Public()`.

- **Dev login**: `POST /api/auth/dev-login/sign-in` with `{ "email": "...", "name"?: "..." }` finds or creates that user and sets the cookie. It exists only when `DEV_LOGIN=true`, and the API refuses to start with it unless `NODE_ENV` is `development` or `test`. `NODE_ENV` has no default, so a container that forgets it does not boot. The login page shows its button only in Vite dev builds. E2E tests can call the endpoint directly.
- **Google**: create an OAuth client (type "Web application") in Google Cloud Console, add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI, and put the ID and secret in `apps/api/.env`. Without them, "Continuar com Google" shows the error alert. Outside `development` and `test` both are required.

## Decks, Cards and images

A Card's question and answer are Tiptap JSON, validated by `richTextSchema` in `packages/shared` and stored with their plain text (for search and list previews). Deleting a Deck or a Card is a soft delete; `POST /api/decks/:id/restore` and `POST /api/cards/:id/restore` back the toast's "Desfazer".

`GET /api/cards` filters by `deckId`, `labelId`, `state` (`new`, `learning`, `mature`) and `due=today` (overdue included), and `q` searches the question, the answer and the Comments, ignoring accents and case (Postgres `unaccent`). The selection actions are `POST /api/cards/move`, `/label`, `/delete` and `/restore`, each with a list of `cardIds`; one missing Card fails the whole request.

Labels (`/api/labels`) can't share a name, even with other accents, case or spacing. Comments are listed and written under their Card (`/api/cards/:id/comments`) and edited or deleted at `/api/comments/:id`. Labels and Comments are soft-deleted too, with the same `restore` routes.

Images are uploaded with `POST /api/images` (multipart, field `file`, PNG/JPG/WebP/GIF up to 5 MB, type read from the bytes) and saved under `UPLOADS_DIR/<user id>/`. `GET /api/images/<file>` only looks in the signed-in user's folder, which is the owner check.

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
