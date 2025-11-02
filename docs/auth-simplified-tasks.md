# Auth Refactor – Simplified Tasks

A short, easy-to-follow list to implement the simplified auth flow.

## 0) Prep

- [ ] Run `bun install`.
- [ ] `npx ultracite check` to baseline.

## 1) Simplify useUser

- [ ] Edit `apps/web/src/hooks/use-user.ts`
  - Set `retry: false`.
  - Keep `enabled: !!token`, `staleTime: 5 * 60_000`.
  - Replace current `retry` and `onError` logic with:
    - `retry: false`.
    - `onError: logout()` (no message matching).
- [ ] Acceptance: With an invalid/expired token, logout triggers immediately (no multi-second loading).

## 2) Simplify layouts

- [ ] Edit `apps/web/src/layouts/protected.tsx`
  - Remove direct `localStorage` reads and custom hydration logic.
  - If no `tokenAtom` -> `<Navigate to="/login?redirect=..." />`.
  - If token exists -> call `useUser()`; while it loads, show a tiny loader; on success, render children.
- [ ] Edit `apps/web/src/layouts/auth.tsx`
  - Remove direct `localStorage` reads and hydration logic.
  - If `tokenAtom` present -> navigate to `redirect` (if any) or `/`; else render children.
- [ ] Edit `apps/web/src/layouts/admin.tsx`
  - Remove localStorage reads; rely on `useUser()` and show content only if `user.role === 'admin'`.
- [ ] Acceptance: No `localStorage` reads; no flicker; protected/admin sections load quickly and redirect appropriately.

## 3) Fix logout UX

- [ ] Edit `apps/web/src/layouts/admin.tsx`
  - Replace `/logout` link with a button that calls the logout atom.
- [ ] (Optional) Add `apps/web/src/routes/logout.tsx`
  - Component that calls logout in `useEffect` and immediately redirects.
- [ ] Acceptance: Clicking logout reliably clears token and returns to login.

## 4) Light verification

- [ ] Manual checks
  - No token: protected routes redirect to login fast.
  - Valid token: refresh on protected route—renders immediately; no loaders stuck.
  - Invalid token: navigate to any protected route—logout triggers instantly, redirecting to login.

## 5) Type, lint, format

- [ ] Run `npx ultracite fix` and `bun run check-types`.
- [ ] Acceptance: No lints; type checks pass.

