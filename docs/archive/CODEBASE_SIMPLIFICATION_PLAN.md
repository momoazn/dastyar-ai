# Codebase Simplification & Dead‑Code Removal Plan

## Goal
Remove dead code, reduce complexity, and improve structure while keeping behavior stable.

## Decisions Locked In
- Migrate all texts to `apps/web/src/lib/texts/**` and delete `apps/web/src/lib/persian-texts.ts`.
- Replace `/settings` with the “new” layout.
- Create a **separate admin page** (admin‑only) for user/model management.
- Delete unused AI elements under `apps/web/src/components/ai-elements/*`.
- Keep `apps/server/src/utils/text-extractor.ts` as canonical and remove duplicate in `apps/server/src/types/messages.ts`.
- Remove `apps/server/src/scripts/init-db.ts`.
- Repurpose `apps/web/src/layouts/admin.tsx` and `apps/web/src/components/user-profile.tsx`.
- Remove unused code.

---

## Phase 0 — Pre‑flight
1. Confirm repo state and baseline: `bun run check-types`.
2. Identify generated files (e.g., `apps/web/src/routeTree.gen.ts`) that should not be edited manually.

---

## Phase 1 — Migrate Texts to `apps/web/src/lib/texts/**`
1. Replace all imports of `apps/web/src/lib/persian-texts.ts` with `apps/web/src/lib/texts/index.ts`.
2. Ensure `fa` structure is preserved; add missing keys to `apps/web/src/lib/texts/**` if any.
3. Delete `apps/web/src/lib/persian-texts.ts`.
4. Verify no remaining references to `persian-texts.ts`.

Exit criteria:
- All `fa` imports come from `apps/web/src/lib/texts/index.ts`.
- `persian-texts.ts` removed.

---

## Phase 2 — Replace `/settings` with “New” Layout
1. Promote “new” settings route to `/settings`.
2. Remove old `/settings` tabbed implementation (account + admin tabs).
3. Delete `apps/web/src/routes/settings-new.tsx` and its component tree if unused.
4. Update any navigation to `/settings-new` → `/settings`.

Exit criteria:
- `/settings` uses the new layout.
- No references to `/settings-new`.

---

## Phase 3 — Separate Admin Page (Admin‑Only)
1. Use `apps/web/src/layouts/admin.tsx` as the admin guard/layout.
2. Create a dedicated admin route (e.g., `/admin`) accessible only to admins.
3. Move admin management UI from old settings into admin page:
   - `UsersTable`
   - `ModelsTable`
   - `SettingsPanel` (if still desired)
4. Ensure admins can manage users/models; non‑admins are redirected/blocked.

Exit criteria:
- Admin features accessible only at `/admin`.
- `/settings` becomes user settings only.

---

## Phase 4 — Remove Unused AI Elements
Delete unused files under `apps/web/src/components/ai-elements/`:
- `actions.tsx`
- `code-block.tsx`
- `image.tsx`
- `reasoning.tsx`

Exit criteria:
- No imports from deleted AI elements.
- App builds without these files.

---

## Phase 5 — Consolidate Text Extraction
1. Keep `apps/server/src/utils/text-extractor.ts` as canonical.
2. Remove `extractTextFromParts` from `apps/server/src/types/messages.ts`.
3. Update imports (e.g., `apps/server/src/routes/chat.ts`) to use the util.
4. Keep/update `apps/server/src/utils/text-extractor.test.ts`.

Exit criteria:
- One canonical text extraction implementation.
- Tests still cover it.

---

## Phase 6 — Remove Unused Server Script
- Delete `apps/server/src/scripts/init-db.ts`.
- Ensure no scripts/docs reference it.

---

## Phase 7 — Repurpose Admin Layout + User Profile
1. `apps/web/src/layouts/admin.tsx`:
   - Use for the new admin page (Phase 3).
2. `apps/web/src/components/user-profile.tsx`:
   - Repurpose into admin user info area or sidebar/profile context; if still unused, remove.

---

## Phase 8 — Verification
1. Type checks: `bun run check-types`.
2. Targeted tests (web + server where changes occur).
3. Manual smoke:
   - `/settings` for non‑admins
   - `/admin` for admins only
   - chat, image, translation, summaries

---

## Phase 9 — Documentation
1. Update `specs/IMPROVEMENTS_TODO.md` with any deferred work.
2. Optionally update `docs/CLEANUP_SUMMARY.md` with removed files.

---

## Deliverables
- Dead code removed.
- Text strings consolidated to `apps/web/src/lib/texts/**`.
- Separate admin page for users/models management.
- Single canonical text extraction utility.
- Passing type checks and relevant tests.
