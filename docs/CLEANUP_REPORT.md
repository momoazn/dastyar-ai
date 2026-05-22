# Cleanup Report

## Summary

- Quality gates fixed and passing.
- Stale docs/specs/report artifacts removed.
- Current docs recreated from codebase.
- Fragile tests and JSON parsing fixed.
- Dead frontend components removed.
- Source archive script added.

## Verification

All gates pass as of 2026-05-22:

- `bun run lint:check` - PASS (0 errors, 327 files)
- `bun run check-types` - PASS (2 successful tasks)
- `bun run test` - PASS (219 server + all web tests, 0 failures)
- `bun --cwd apps/web build` - PASS (chunk warnings remain, documented)
- `bun --cwd apps/server build` - PASS (956 modules bundled)
- `bun run archive` - PASS (360 source files, no noise)

## Changes Made

### Quality Gate Fixes
- **turbo.json**: Added `test` and `test:coverage` tasks
- **error-boundary.test.tsx**: Fixed assertion to match current ErrorBoundary behavior (title: `خطای غیرمنتظره`, message: `خطای ناشناخته`, reset button present)
- **llm-json.ts**: Replaced regex `JSON_OBJECT_REGEX` with balanced brace scan supporting nested objects
- **auth.ts**: Made `findUserById` injectable via optional parameter for testability
- **auth.test.ts**: Updated to pass mock dependency directly; removed fragile import mocking

### Lint Fixes
- `lint:fix` applied formatting/sorting across UI components (models-table, ollama-servers-table, users-table, user-detail-dialog, alert-dialog, dialog, dropdown-menu, password-input, select, sheet, sidebar)
- `user-detail-dialog.tsx`: Changed `key={index}` to `key={ip}` for IP badge list
- `llm-json.ts`: Extracted string state machine to helper to reduce cognitive complexity

### Removed
- **Stale docs**: CLEAN_DOCUMENTATION_INDEX.md, PROJECT-STRUCTURE.md, README.md, SECRETS.md, TASKS.md, admin-panel.md, thesis-proposal.md
- **Stale specs**: README.md, legacy auth testing plan, IMPROVEMENTS_TODO.md
- **Report artifacts**: report/ (entire directory)
- **Duplicate agent doc**: CLAUDE.md (AGENTS.md covers current instructions)
- **Stale READMEs**: scripts/README.md, apps/whisper/README.md
- **Missing script**: seed:models removed from server package.json (file didn't exist)
- **Dead components**: add-model-dialog.tsx, toolbar-row.tsx, account-settings.tsx

### New Docs
- `README.md`: Replaced with current quick start and command reference
- `docs/HANDOFF.md`: Junior developer handoff with setup, safe tasks, risky areas
- `docs/ARCHITECTURE.md`: Server/web/whisper code map and data flow
- `docs/OPERATIONS.md`: Dev, build, test, DB, config commands
- `docs/API.md`: ORPC procedure list, REST endpoints, auth overview

### New Scripts
- `scripts/archive.ts`: Source-only archive using `git ls-files` allowlist, excludes node_modules, dist, generated images, uploads, whisper.cpp

## Remaining Risks

- **Whisper full Go tests**: Require whisper.cpp headers/build artifacts. Not hermetic without vendoring. Smoke command `bun run dev:whisper` works for integration testing.
- **Web bundle chunks**: Several chunks >500kB from react-syntax-highlighter language packs, Mermaid diagrams, and KaTeX fonts. Justified for code/markdown rendering features.
- **Large route files**: `apps/web/src/routes/code/index.tsx` (656 lines), `code/$runId.tsx` (429 lines), `translation/index.tsx` (482 lines) are functional but could benefit from extraction in future refactoring.
