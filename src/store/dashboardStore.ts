import type { SessionData } from '../types';
import { calculateMetrics } from '../utils/calculations';

let rawData: SessionData[] = [];
let processedData: (SessionData & { metrics: ReturnType<typeof calculateMetrics> })[] = [];

type Listener = (data: typeof processedData) => void;
const listeners: Listener[] = [];

export function setRawData(sessions: SessionData[]) {
  rawData = sessions || [];
  processedData = rawData.map((s) => ({ ...s, metrics: calculateMetrics(s) }));
  listeners.forEach((l) => l(processedData));
}

export function getProcessedData() {
  return processedData;
}

export function subscribe(cb: Listener) {
  listeners.push(cb);
  // provide current
  cb(processedData);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function clearStore() {
  rawData = [];
  processedData = [];
  listeners.forEach((l) => l(processedData));
}
