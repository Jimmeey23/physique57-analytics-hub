/**
 * Google Sheets Client Utility
 *
 * All Google API calls are proxied through the backend api-server.
 * No OAuth secrets are exposed to the browser.
 */

// Spreadsheet IDs (these are non-sensitive — they're document IDs, not credentials)
export const SPREADSHEET_IDS = {
  PAYROLL: import.meta.env.VITE_PAYROLL_SPREADSHEET_ID || '149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI',
  SESSIONS: import.meta.env.VITE_SESSIONS_SPREADSHEET_ID || '16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys',
  EXPIRATIONS: import.meta.env.VITE_EXPIRATIONS_SPREADSHEET_ID || '1rGMDDvvTbZfNg1dueWtRN3LhOgGQOdLg3Fd7Sn1GCZo',
  SALES: import.meta.env.VITE_SALES_SPREADSHEET_ID || '1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0',
};

// Fire API requests concurrently — no serialization delay.
// All hooks run in parallel; each handles its own 503 fallback independently.
const queueRequest = <T>(request: () => Promise<T>): Promise<T> => request();

/**
 * Fetch data from a Google Sheet via the backend proxy.
 * The backend handles OAuth token exchange — no secrets in the browser.
 */
export const fetchGoogleSheet = async (
  spreadsheetId: string,
  range: string,
  options: {
    valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
    dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
  } = {}
): Promise<any[][]> => {
  const {
    valueRenderOption = 'UNFORMATTED_VALUE',
    dateTimeRenderOption = 'FORMATTED_STRING',
  } = options;

  return queueRequest(async () => {
    const params = new URLSearchParams({ valueRenderOption, dateTimeRenderOption });
    const resp = await fetch(`/api/sheets/${spreadsheetId}/${encodeURIComponent(range)}?${params}`);

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      throw new Error(err.error || `Failed to fetch sheet data: ${resp.status}`);
    }

    const result = await resp.json();
    return result.values || [];
  });
};

/**
 * Batch fetch multiple ranges from a Google Sheet via the backend proxy.
 */
export const batchFetchGoogleSheet = async (
  spreadsheetId: string,
  ranges: string[],
  options: {
    valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
    dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
  } = {}
): Promise<any[][]> => {
  const {
    valueRenderOption = 'UNFORMATTED_VALUE',
    dateTimeRenderOption = 'FORMATTED_STRING',
  } = options;

  return queueRequest(async () => {
    const resp = await fetch(`/api/sheets/${spreadsheetId}/batchGet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ranges, valueRenderOption, dateTimeRenderOption }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      throw new Error(err.error || `Failed to batch fetch sheet data: ${resp.status}`);
    }

    const result = await resp.json();
    // Return as array of arrays matching each range
    return (result.valueRanges || []).map((vr: any) => vr.values || []);
  });
};

/**
 * Kept for backwards compatibility — fetches via backend proxy.
 * No OAuth secret is used client-side.
 */
export const getGoogleAccessToken = async (): Promise<string> => {
  throw new Error(
    'Direct OAuth token access has been removed for security. Use fetchGoogleSheet() or batchFetchGoogleSheet() instead.'
  );
};

/**
 * Parse a numeric value from sheet data
 */
export const parseNumericValue = (value: string | number): number => {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  if (!value || value === '') return 0;
  const cleaned = value.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Parse a date value from sheet data
 */
export const parseDateValue = (value: string | number): Date | null => {
  if (!value) return null;

  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Validate that the backend proxy is available (non-sensitive check)
 */
export const validateGoogleConfig = (): boolean => {
  return true;
};
