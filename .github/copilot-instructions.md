# Copilot / AI agent instructions — FE-smarttasty

This file contains focused, actionable guidance for AI coding agents working in this repository. Keep suggestions small, visible, and aligned with existing patterns.

Overview

- This is a Next.js (app-router) TypeScript project (Next 15, React 19). The app uses the `app/` folder with localized subfolders under `src/app/[locale]/`.
- i18n is handled with `next-intl`. Routing is defined in `src/i18n/routing.ts` (locales: `vi`, `en`; default `vi`). See `src/i18n/navigation.ts` for navigation helpers (`Link`, `redirect`, `usePathname`).

Key workflows

- Run dev: `npm run dev` (uses `next dev`). Build: `npm run build`. Lint: `npm run lint`.
- Environment: API base URL comes from `process.env.NEXT_PUBLIC_API_BASE_URL`.
- Deployment target: README suggests Vercel; follow standard Next.js/Vercel flow.

Conventions and patterns to follow

- Client vs server: Many components are client components. Preserve or add `"use client";` at the top of client-side files when interacting with hooks, localStorage, or React state. Example: `src/app/LayoutClient.tsx`.
- i18n middleware: `src/middleware.ts` wires `next-intl` routing and uses matcher to exclude `api|trpc|_next|_vercel|.*\..*` — do not change matcher unless routing needs change.
- Axios instance: `src/lib/axios/axiosInstance.ts` centralizes API calls. It reads token from `localStorage` key `token` and sets `Authorization: Bearer <token>`. It avoids setting `Content-Type` when request data is FormData. When adding new network logic, prefer updating this instance or adding request-specific config rather than duplicating token logic.
- State: Redux Toolkit store in `src/redux/store.ts` composes slices from `src/redux/slices/*.ts`. Use `useAppDispatch` and `useAppSelector` from `src/redux/hook.ts` for typed hooks.
- React Query: `src/lib/reactQuery/index.ts` exports a `queryClient`. Use it for cache/invalidation.
- The project uses Tailwind + global CSS (`src/app/globals.css`) and theme variables via `data-theme` attributes. Follow the variable names (`--background`, `--text-color`, etc.) when styling components.

Files you should inspect when modifying behavior

- Routing / i18n: `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/app/[locale]/layout.tsx` and localized pages under `src/app/[locale]/...`
- Network: `src/lib/axios/axiosInstance.ts`
- State: `src/redux/store.ts`, `src/redux/slices/*`, `src/redux/hook.ts`
- App entry / providers: `src/app/LayoutClient.tsx`, `src/components/commons/Providers/Providers.tsx`
- Images and constants: `src/assets/Image/` and `src/constants/config/imageBaseUrl.ts`

Small concrete examples

- Add a new API call with auth:
  - Use `src/lib/axios/axiosInstance.ts`: axiosInstance.get('/path') — token is appended automatically.
- Add a localized navigation redirect:
  - Use `redirect('/some-path')` from `src/i18n/navigation.ts` inside server or client actions as supported by next-intl.
- FormData upload:
  - When sending files, pass FormData to `axiosInstance` and do NOT set `Content-Type` manually; the instance intentionally leaves it unset so axios can add the boundary.

Testing and linting

- Dev deps include `vitest` and testing-library. Tests are not present in the repo root by default — add tests under a `tests/` or alongside components following existing project style.
- Linting uses `next lint` (script `lint`). Run `npm run lint` before PRs.

Gotchas and notes

- Don't hardcode API base URLs — use `NEXT_PUBLIC_API_BASE_URL`.
- Token and user data: the code stores `token` and `user` in `localStorage` — be conservative when refactoring auth flow and ensure server-side rendering paths handle missing window/localStorage.
- File paths: this project often uses `@/` aliases. Verify tsconfig paths if changing imports.

If you change project structure

- Update `next.config.ts` (images remotePatterns) and `src/middleware.ts` matcher if you add special routes that should be excluded from i18n middleware.

When in doubt

- Open the following files first: `src/lib/axios/axiosInstance.ts`, `src/redux/store.ts`, `src/i18n/routing.ts`, `src/app/LayoutClient.tsx`.

Feedback

- If any of these references are outdated or you want more examples (unit test template, a PR checklist, or common refactors), tell me which area to expand.
