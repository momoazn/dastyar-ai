# Handoff

## Current Status

- Typecheck, lint, tests, web build, and server build pass after cleanup.
- Whisper service requires `whisper.cpp` headers/build artifacts for full Go tests. Use the documented smoke command if full Go tests are environment-dependent.

## First Day For Junior Developer

1. Install Bun and Go.
2. Run `bun install`.
3. Run `bun run check-types`.
4. Run `bun run lint:check`.
5. Run `bun run test`.
6. Start app with `bun run dev`.

## Safe Starter Tasks

- Add focused tests around one procedure or UI component.
- Update a single route using existing scaffold components.
- Improve one repository method with a regression test.

## Risky Areas

- Auth/session behavior.
- DB schema and migrations.
- File upload validation/storage.
- Build/package scripts.
- Whisper native dependency setup.

## Bundle Weight

- Web build emits large chunk warnings (>500kB) from `react-syntax-highlighter` language packs, Mermaid diagrams, and KaTeX fonts. These are justified for code rendering and markdown display features.
