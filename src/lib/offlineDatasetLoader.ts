import { getOfflineDatasetRows, saveOfflineDatasetRows } from '@/lib/offlineDataStore';
import type { DataSourceMode, DatasetLiveSource, OfflineDatasetKey } from '@/types/offlineData';
import { logger } from '@/utils/logger';

interface DatasetRowsResult {
  rows: any[][];
  source: DatasetLiveSource;
}

export const loadDatasetRowsForMode = async (
  key: OfflineDatasetKey,
  mode: DataSourceMode,
  remoteLoader: () => Promise<any[][]>,
  onSource?: (key: OfflineDatasetKey, source: DatasetLiveSource) => void,
): Promise<DatasetRowsResult> => {
  const cachedRows = await getOfflineDatasetRows(key);

  const finish = (rows: any[][], source: DatasetLiveSource): DatasetRowsResult => {
    if (source === 'remote') {
      logger.info(`[data] ${key}: live rows loaded (${rows.length} rows)`);
    } else {
      logger.warn(`[data] ${key}: remote fetch failed in ${mode} mode — serving ${rows.length} cached rows`);
    }
    try {
      onSource?.(key, source);
    } catch {
      /* listener errors must never break data loading */
    }
    return { rows, source };
  };

  if (mode === 'offline') {
    if (cachedRows && cachedRows.length > 0) {
      return finish(cachedRows, 'offline-cache');
    }
    throw new Error(`Offline dataset not available for ${key}. Upload a CSV/XLSX file or open the app online first.`);
  }

  try {
    const remoteRows = await remoteLoader();
    if (remoteRows && remoteRows.length > 0) {
      await saveOfflineDatasetRows(key, remoteRows, 'remote');
    }
    return finish(remoteRows, 'remote');
  } catch (error) {
    if (cachedRows && cachedRows.length > 0) {
      return finish(cachedRows, 'offline-cache');
    }
    throw error;
  }
};
