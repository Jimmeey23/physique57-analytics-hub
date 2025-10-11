# AI Notes & Summary Persistence

This app can persist AI notes and summaries per table (and per location/period) in a shared Google Sheet so everyone who opens the app sees the same saved notes.

## How it works
- Client calls `/api/notes` (serverless function) to GET/POST notes.
- The API authenticates to Google Sheets using a Service Account.
- Notes are appended to a sheet (default: `AI_Notes`) with columns:
  `timestamp, tableKey, location, period, sectionId, author, note, summary, version`.
- A lightweight React hook (`useNotes`) and UI component (`AiNotes`) handle loading and saving under any table.

## Setup
1. Create a Google Cloud Service Account and enable Google Sheets API.
2. Create a Google Sheet and share it with the Service Account email (Editor access).
3. Add the following environment variables in your deploy platform (e.g., Vercel Project Settings → Environment Variables):
   - `GOOGLE_CLIENT_EMAIL` – from your service account
   - `GOOGLE_PRIVATE_KEY` – the private key; ensure newlines are preserved or use `\\n` in env
   - `NOTES_SHEET_ID` – your Google Sheet ID
   - (optional) `NOTES_SHEET_NAME` – default `AI_Notes`

## Usage in components
```tsx
import { AiNotes } from '@/components/ui/AiNotes';

// Inside a table section component
<AiNotes 
  tableKey="sessions:advancedAttendance"
  location={selectedLocation}
  period={currentPeriodId}
  sectionId="executive-tables"
  initialSummary={generatedSummary}
/>
```

The `tableKey` should uniquely identify the table (and view) you’re saving notes for.

## Local development
- For local dev without serverless auth, you can temporarily set the older OAuth flow, but recommended is to test using the Service Account. Create a `.env.local` with the vars above and run your dev server.

## Security notes
- Do NOT commit secrets. Use environment variables.
- The API only appends and reads; for editing/deleting, extend the API with proper auth/roles.
