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
