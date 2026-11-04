# AGENTS.md

Guide for AI coding agents and contributors.

## What this is

Dastyar AI is a self-hosted AI assistant: chat, translation, summaries, images, documents, code runs, and speech-to-text. The UI is in Persian. It talks to Ollama, Stable Diffusion, and a local Whisper service.

## Layout

Bun workspaces with Turbo.

- `apps/server`: Bun and Hono API, ORPC, SQLite with Drizzle.
- `apps/web`: React, Vite, TanStack Router.
- `apps/whisper`: Go speech-to-text service. `dev.ts` launches it.
- `scripts/`: build, start, stop, and status scripts.
- `docs/fa/`: user guides in Persian (HTML).

## Commands

Run from the repo root.

- `bun install`: install dependencies.
- `bun run dev`: web and server together. Also `dev:web`, `dev:server`, `dev:whisper`.
- `bun run build`: full build (web, server, whisper). `build:fast` skips deps and whisper.
- `bun scripts/build.ts --skip-web --skip-server --skip-package`: build only whisper.
- `bun run check-types`: type check all apps.
- `bun run test`: run tests.
- `bun run lint:check` / `bun run lint:fix`: Biome through Ultracite.
- `bun run db:generate`: create a Drizzle migration. `bun run db:migrate`: apply it.
- `bun run config:generate` / `config:validate` / `config:show`: manage config.

## Config

- One `config.json` in the repo root. Generate it with `bun run config:generate`.
- Keys and defaults are in `apps/server/src/config-schema.ts`. `config.example.json` is a template.
- `config.json` holds secrets. Never commit it.
- Without `config.json`, the server uses defaults. Tests do not need it.

## Rules

- Lint rules come from Ultracite (Biome). Run `bun run lint:fix` before you finish.
- Use `logger` from `apps/server/src/lib/logger.ts`. Do not use `console.log` in server code.
- Define API endpoints as ORPC procedures in `apps/server/src/procedures`. Register them in `procedures/index.ts`.
- Access the database only through `apps/server/src/repositories`. Procedures call repositories or services.
- Change the schema in `apps/server/src/database/schema`. Then run `bun run db:generate` and commit the new migration in `database/migrations`.
- Put user-facing server text in `apps/server/src/lib/texts.ts`.
- Read settings from `apps/server/src/config.ts`. Do not read `process.env` directly.
- In `apps/web` and `apps/server`, import with the `@/` alias.
- Put tests next to the code as `*.test.ts`. Use `bun test`.
