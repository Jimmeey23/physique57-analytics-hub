/**
 * Centralized Google OAuth Authentication Utility
 * 
 * This module provides a single source of truth for Google API authentication,
 * with built-in rate limiting, caching, and error handling.
 */

// Google OAuth Configuration from environment variables
const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  CLIENT_SECRET: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
  REFRESH_TOKEN: import.meta.env.VITE_GOOGLE_REFRESH_TOKEN || '',
  TOKEN_URL: import.meta.env.VITE_GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token'
};

// Spreadsheet IDs
export const SPREADSHEET_IDS = {
  PAYROLL: import.meta.env.VITE_PAYROLL_SPREADSHEET_ID || '149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI',
  NEW_CLIENTS: import.meta.env.VITE_PAYROLL_SPREADSHEET_ID || '149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI',
  SESSIONS: import.meta.env.VITE_SESSIONS_SPREADSHEET_ID || '16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys',
  EXPIRATIONS: import.meta.env.VITE_EXPIRATIONS_SPREADSHEET_ID || '1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I',
  SALES: import.meta.env.VITE_SALES_SPREADSHEET_ID || '1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0',
  LEADS: import.meta.env.VITE_LEADS_SPREADSHEET_ID || '1dQMNF69WnXVQdhlLvUZTig3kL97NA21k6eZ9HRu6xiQ',
  CHECKINS: import.meta.env.VITE_CHECKINS_SPREADSHEET_ID || '1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q',
  BOOKINGS: import.meta.env.VITE_BOOKINGS_SPREADSHEET_ID || '1OO-Pk7P__1uqsRdmFZ82JBl4-LGPPr7MCTbwKgeLqL0',
};

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Request queue for rate limiting
interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  request: () => Promise<any>;
}

const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 350; // ~171 req/min sustained, inside the 300 reads/min/user Sheets quota

/**
 * Get a valid access token, using cache when possible
 */
export const isGoogleOAuthConfigured = (): boolean =>
  Boolean(GOOGLE_CONFIG.CLIENT_ID && GOOGLE_CONFIG.CLIENT_SECRET && GOOGLE_CONFIG.REFRESH_TOKEN);

export const getGoogleAccessToken = async (): Promise<string> => {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  if (!isGoogleOAuthConfigured()) {
    throw new Error(
      'Google OAuth is not configured (missing VITE_GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_SECRET / VITE_GOOGLE_REFRESH_TOKEN). ' +
      'Falling back to public sheet access.'
    );
  }

  try {
    const response = await fetch(GOOGLE_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
        refresh_token: GOOGLE_CONFIG.REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData = await response.json();
    
    // Cache the token (typically valid for 1 hour)
    cachedToken = tokenData.access_token;
    tokenExpiry = Date.now() + (tokenData.expires_in || 3600) * 1000;
    
    return cachedToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

/**
 * Process the request queue with rate limiting
 */
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    
    const item = requestQueue.shift();
    if (!item) continue;
    
    try {
      lastRequestTime = Date.now();
      const result = await item.request();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }
  }
  
  isProcessingQueue = false;
};

/**
 * Queue a request to be executed with rate limiting
 */
export const queueRequest = <T>(request: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, request });
    processQueue();
  });
};

/**
 * Fetch a tab from a *publicly shared* spreadsheet via the gviz endpoint.
 * Returns rows in the same shape as the Sheets API (`values`: header + data rows).
 * Used automatically when OAuth credentials are unavailable.
 */
export const fetchPublicSheetRange = async (
  spreadsheetId: string,
  range: string,
  signal?: AbortSignal
): Promise<any[][]> => {
  const bang = range.indexOf('!');
  const tabPart = bang >= 0 ? range.slice(0, bang) : range;
  const a1 = bang >= 0 ? range.slice(bang + 1) : '';
  let sheet = tabPart.replace(/^'+|'+$/g, '');
  try {
    // Tolerate pre-encoded tab names (e.g. '◉ Leads' -> %E2%97%89%20Leads).
    sheet = decodeURIComponent(sheet);
  } catch {
    /* not encoded — use as-is */
  }
  const url =
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json` +
    `&sheet=${encodeURIComponent(sheet)}${a1 ? `&range=${encodeURIComponent(a1)}` : ''}&headers=1`;
  const response = await fetch(url, signal ? { signal } : undefined);
  if (!response.ok) {
    throw new Error(`Public sheet fetch failed: ${response.status}`);
  }
  const text = await response.text();
  const match = text.match(/setResponse\(([\s\S]*)\)\s*;?\s*$/);
  if (!match) throw new Error('Unexpected public sheet response');
  const payload = JSON.parse(match[1]);
  if (payload.status !== 'ok') {
    throw new Error(`Public sheet error: ${payload.errors?.[0]?.detailed_message || payload.status}`);
  }
  const cols: any[] = payload.table?.cols || [];
  const header = cols.map((c) => (c && c.label != null ? String(c.label) : ''));
  const dataRows: any[][] = (payload.table?.rows || []).map((r: any) =>
    (r.c || []).map((cell: any) => {
      if (cell == null) return '';
      const v = cell.v;
      if (typeof v === 'string' && /^Date\(/.test(v)) return cell.f ?? v;
      return v ?? cell.f ?? '';
    })
  );
  return [header, ...dataRows];
};

/**
 * OAuth-first sheet fetch with automatic fallback to the public gviz
 * endpoint when credentials are missing/expired. `range` may be a plain
 * tab name (optionally pre-encoded) or `Tab!A1:Z` notation.
 */
export const fetchSheetValuesSmart = async (
  spreadsheetId: string,
  range: string,
  signal?: AbortSignal
): Promise<{ values: any[][] }> => {
  try {
    const accessToken = await getGoogleAccessToken();
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?alt=json`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        ...(signal ? { signal } : {}),
      }
    );
    if (!response.ok) throw new Error(`Sheet API failed: ${response.status}`);
    return response.json();
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    const values = await fetchPublicSheetRange(spreadsheetId, range, signal);
    return { values };
  }
};

/**
 * Fetch data from a Google Sheet with rate limiting.
 * OAuth first; when OAuth is unavailable or the API call fails, falls back
 * to the public gviz endpoint (works for publicly shared spreadsheets).
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
    dateTimeRenderOption = 'FORMATTED_STRING'
  } = options;

  return queueRequest(async () => {
    try {
      const accessToken = await getGoogleAccessToken();

      const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
      url.searchParams.set('valueRenderOption', valueRenderOption);
      url.searchParams.set('dateTimeRenderOption', dateTimeRenderOption);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch sheet data: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.values || [];
    } catch (error) {
      console.warn(`[googleAuth] Sheets API failed for ${spreadsheetId} / ${range}; trying public access:`, error);
      return fetchPublicSheetRange(spreadsheetId, range);
    }
  });
};

/**
 * Batch fetch multiple ranges from a Google Sheet
 */
export const batchFetchGoogleSheet = async (
  spreadsheetId: string,
  ranges: string[],
  options: {
    valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
    dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
  } = {}
): Promise<Map<string, any[][]>> => {
  const { 
    valueRenderOption = 'UNFORMATTED_VALUE',
    dateTimeRenderOption = 'FORMATTED_STRING'
  } = options;

  return queueRequest(async () => {
    try {
      const accessToken = await getGoogleAccessToken();

      const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet`);
      ranges.forEach(range => url.searchParams.append('ranges', range));
      url.searchParams.set('valueRenderOption', valueRenderOption);
      url.searchParams.set('dateTimeRenderOption', dateTimeRenderOption);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to batch fetch sheet data: ${response.status}`);
      }

      const result = await response.json();
      const resultMap = new Map<string, any[][]>();

      result.valueRanges?.forEach((vr: any, index: number) => {
        resultMap.set(ranges[index], vr.values || []);
      });

      return resultMap;
    } catch (err) {
      // No OAuth credentials (or API unreachable) → read public tabs one by one
      const resultMap = new Map<string, any[][]>();
      for (const range of ranges) {
        resultMap.set(range, await fetchPublicSheetRange(spreadsheetId, range));
      }
      return resultMap;
    }
  });
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
  
  // Handle Excel serial date numbers
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Validate that required environment variables are set
 */
export const validateGoogleConfig = (): boolean => {
  const required = ['VITE_GOOGLE_CLIENT_ID', 'VITE_GOOGLE_CLIENT_SECRET', 'VITE_GOOGLE_REFRESH_TOKEN'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing Google OAuth environment variables:', missing);
    return false;
  }
  
  return true;
};

// Validate on module load
if (import.meta.env.DEV) {
  validateGoogleConfig();
}
