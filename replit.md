# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Known Issues / Architecture Notes

- Google API credentials not configured in this dev environment — all data hooks return 503 errors and fall back to offline cache if available
- `useRecurringSessionsData` does not use `loadDatasetRowsForMode` — has no offline/demo mode support (no `recurring` key in `OfflineDatasetKey`)
- Trainer filter in `LateCancellations.tsx` uses `paymentMethodName` (the Late Cancellations sheet has no `teacherName` column)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Physique 57 India Analytics Dashboard (`artifacts/dashboard/`)
- React + Vite + Tailwind v3 + shadcn/ui frontend
- Multi-page analytics dashboard for Physique 57 India fitness studios
- Pages: Sales Analytics, Executive Summary, Trainer Performance, Class Attendance, Payroll, Client Retention, and more
- Data from Google Sheets via API server routes (requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_SHEETS_SPREADSHEET_ID env vars)
- AI summaries via OpenAI (VITE_OPENAI_API_KEY) and Gemini (VITE_GEMINI_API_KEY)
- Intercom support chat (VITE_INTERCOM_APP_ID)
- Routes at `/` (previewPath)

### API Server (`artifacts/api-server/`)
- Express 5 backend
- Routes: `/api/healthz`, `/api/notes` (GET/POST/DELETE), `/api/payroll` (GET)
- Notes and payroll data proxied from Google Sheets
- Requires Google OAuth credentials as env vars

## Data Architecture (Dashboard)

### Remote-first data loading (current)
- **Bundled CSVs**: 7 CSV files in `artifacts/dashboard/public/offline-files/` (sessions, sales, checkins, leads, new-clients, payroll, recurring-sessions). ~20k rows each.
- **IndexedDB**: `p57-offline-data` database, `datasets` store. `DB_VERSION = 2` (bumped to clear v1 stale data).
- **Seeding**: `DataSourceContext` renders children immediately (no spinner). `seedBundledOfflineDatasets()` runs in background and calls `notifySeedingComplete()` when finished (also called in catch).
- **`seedingCompletePromise`**: exported from `offlineDataStore.ts`. `offlineDatasetLoader.ts` awaits it before falling back to IndexedDB cache — eliminates race condition where 503 arrives before seeding populates IndexedDB.
- **Remote-first**: `offlineDatasetLoader.ts` tries Google Sheets first. If that returns a non-OK response it waits for `seedingCompletePromise` then falls back to IndexedDB cache.
- **No request queue**: `googleAuth.ts` fires all requests concurrently — 500ms serialized queue removed.
- **No dark spinner**: `DataSourceContext` removed "Preparing dashboard data…" block; children render immediately.

### XLSX / Date parsing (CRITICAL)
- `parseSpreadsheetBufferToRows` uses **`cellDates: true` + `dateNF: 'yyyy-mm-dd'`** — date cells in CSVs are serialised as `"2024-02-29"` (ISO format), not the default `"2/29/24"` (M/D/YY) that XLSX would otherwise produce.
- Without these options, XLSX returns dates as Excel serial numbers formatted as M/D/YY. The date filter in `useFilteredSessionsData` misparses them (interprets month as day, 2-digit year as 1900s) → every session gets excluded → all metrics show 0.
- `useFilteredSessionsData` handles BOTH formats: YYYY-MM-DD (post-fix seedings) and M/D/YY (legacy IndexedDB data migrated via fallback logic).
- DB_VERSION 2 upgrade handler deletes and recreates the store, clearing any v1 data that had wrong date formats.

### Default date filter
- `SessionsFiltersContext` defaults to `getPreviousMonthDateRange()` = the previous complete calendar month.
- With today = May 2026, this means April 2026 is the default filter window.
- Sessions CSV covers Jan 2024 – Apr 2026 (581 sessions in April 2026, 228 Kwality House).

### Key hooks
- `useSessionsData` — loads sessions from IndexedDB/remote, maps XLSX rows to `SessionData[]`
- `useFilteredSessionsData` — applies `SessionsFiltersContext` filters (date range, trainers, class types, etc.)
- `useGoogleSheets` — loads sales data, also uses `loadDatasetRowsForMode`

### Component architecture (ClassAttendance)
- `InnerContent` extracted to **module level** (not inside parent component) to prevent React from recreating the component type on every parent render.
- No early `if (loading) return` guard — renders immediately with 0 metrics, populates as data loads.
- `OutlierAnalysis` (CustomDataLab page): same guard removed.

## Environment Variables Needed
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `GOOGLE_REFRESH_TOKEN` — Google OAuth refresh token
- `GOOGLE_SHEETS_SPREADSHEET_ID` — Google Sheets spreadsheet ID for payroll
- `NOTES_SHEET_ID` — Google Sheets spreadsheet ID for notes
- `NOTES_SHEET_NAME` — Sheet name for notes (default: Notes)
- `VITE_GOOGLE_CLIENT_ID` — same as GOOGLE_CLIENT_ID (for frontend)
- `VITE_GOOGLE_CLIENT_SECRET` — same as GOOGLE_CLIENT_SECRET (for frontend)
- `VITE_GOOGLE_REFRESH_TOKEN` — same as GOOGLE_REFRESH_TOKEN (for frontend)
- `VITE_OPENAI_API_KEY` — OpenAI API key for AI summaries
- `VITE_GEMINI_API_KEY` — Google Gemini API key for AI summaries
- `VITE_INTERCOM_APP_ID` — Intercom app ID for support chat
