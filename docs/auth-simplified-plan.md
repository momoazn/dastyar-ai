# Auth Refactor – Simplified Plan

Goal: Make auth predictable and minimal with as few moving parts as possible. No providers, no JWT decoding, no global interceptors. Rely on a single `useUser` guard and lean layouts.

## Principles

- Single source of truth: `tokenAtom` (from `atomWithStorage`).
- Validate token only when needed: on protected routes via `useUser`.
- Fail fast: no retries for `auth.me`; on 401, logout immediately.
- No direct `localStorage` reads in components; use atoms only.

## What changes

1) `useUser` becomes strict and fast
- `enabled: !!token`, `retry: false`, reasonable `staleTime`.
- `onError` calls `logout()` immediately (no message matching).

2) Layouts are simplified
- `ProtectedLayout`
  - If no token -> redirect to `/login?redirect=...`.
  - If token -> call `useUser`.
    - While loading: render a tiny inline loader.
    - On error: `useUser` logs out; layout will redirect on next render.
    - On success: render children.
- `AuthLayout`
  - If token -> navigate to `redirect` query or `/`.
  - Else -> render children (login/register forms).
- `AdminLayout`
  - Uses `useUser` like above; renders only when user.role === 'admin'. Otherwise, show access denied with a back button.

3) Logout is consistent but minimal
- `logoutAtom` clears `tokenAtom`.
- Redirect is handled by layouts naturally (after logout, `ProtectedLayout` shows redirect to login; `AuthLayout` shows forms).
- Optionally add `/logout` route that calls logout on mount for link-based flows.

## What we don’t add

- No `AuthProvider`.
- No `authReadyAtom`.
- No JWT decode client-side.
- No global 401 interceptor.

## Result

- Invalid/expired token gets logged out immediately when entering a protected area.
- No hydration flicker; no double reads from `localStorage`.
- Very small diff footprint and easy to reason about.

