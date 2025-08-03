# CRUSH.md

Quick reference for agentic coding in this repo.

Commands
- Dev (all): bun run dev
- Frontend: bun run web:dev | build: bun run web:build | preview: bun run web:preview
- API: bun run api:dev | start: bun run api:start | build: bun run api:build
- PocketBase: bun run pb:dev | start: bun run pb:start | build: bun run pb:build
- Typecheck: bun run type-check
- Lint: bun run lint | fix: bun run lint:fix
- Format: bun run fmt | check: bun run fmt:check
- Build (frontend+Go): bun run build
- Clean: bun run clean | clean all: bun run clean:all
- Seed/types: bun run pb:typegen

Testing
- No test framework configured. Use TypeScript + ESLint as quality gates.
- Single check loop: bun run type-check && bun run lint

Style guidelines
- Imports: external libs first, then internal aliases ("@/" → src/), then relative. Group and sort consistently.
- Formatting: Prettier + tailwind plugin; run bun run fmt before commits.
- Types: strict TS; prefer explicit interfaces/types, narrow types, and zod for runtime validation; avoid any; use PocketBase generated types in src/lib/pocketbase-types.ts.
- React: functional components, typed props interfaces, hooks in src/hooks; memo/useMemo/useCallback for perf; RTL-friendly UI using shadcn/ui.
- Naming: files kebab-case; hooks start with use-; constants SCREAMING_SNAKE_CASE; atoms in atoms.ts; components in kebab-case .tsx.
- State: Jotai for client state; TanStack Query for server state; persist via localStorage keys with clear prefixes.
- Error handling: try/catch API calls; return user-friendly Persian messages; structured console logs; never log secrets.
- API: Hono handlers with zod validation; SSE for streaming; PocketBase for storage; adhere to endpoints in CLAUDE.md.
- Performance: debounce where needed, memoize expensive comps, detect text direction and cache.

Cursor/Copilot rules
- Follow .cursor/rules/cursor-rules.mdc (React TS, Tailwind, Jotai, Query, RTL, logging, structure).
- No Copilot rules file detected.
