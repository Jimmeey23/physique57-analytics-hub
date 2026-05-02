import { getOfflineDataset, saveOfflineDatasetRows, seedingCompletePromise } from '@/lib/offlineDataStore';
import type { DataSourceMode, OfflineDatasetKey } from '@/types/offlineData';

interface DatasetRowsResult {
  rows: any[][];
  source: 'remote' | 'offline-cache';
}

export const loadDatasetRowsForMode = async (
  key: OfflineDatasetKey,
  mode: DataSourceMode,
  remoteLoader: () => Promise<any[][]>,
): Promise<DatasetRowsResult> => {
  if (mode === 'offline') {
    const cachedRecord = await getOfflineDataset(key);
    const cachedRows = cachedRecord?.rows ?? null;
    if (cachedRows && cachedRows.length > 0) {
      return { rows: cachedRows, source: 'offline-cache' };
    }
    throw new Error(`Offline dataset not available for ${key}. Upload a CSV/XLSX file or open the app online first.`);
  }

  // Online mode: always try Google Sheets first (remote-first).
  // Fall back to bundled cache only when the remote is unavailable.
  try {
    const remoteRows = await remoteLoader();
    if (remoteRows && remoteRows.length > 0) {
      // Persist fresh remote data so it's available for offline/cache-fallback later.
      void saveOfflineDatasetRows(key, remoteRows, 'remote').catch(() => {});
      return { rows: remoteRows, source: 'remote' };
    }
  } catch {
    // Remote unavailable (503, network error, etc.) — fall through to cache below.
  }

  // Remote failed: wait for bundled seeding to complete (fast — usually already done),
  // then serve from IndexedDB cache so the page still shows real data.
  await seedingCompletePromise;

  const cachedRecord = await getOfflineDataset(key);
  const cachedRows = cachedRecord?.rows ?? null;
  if (cachedRows && cachedRows.length > 0) {
    return { rows: cachedRows, source: 'offline-cache' };
  }

  throw new Error(
    `Data unavailable for "${key}". Connect to Google Sheets or upload a file in Offline Access settings.`,
  );
};
