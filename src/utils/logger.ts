/**
 * Centralized Logging Utility
 * 
 * Provides consistent logging across the application with
 * environment-aware log levels and formatting.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  source?: string;
}

const isProd = import.meta.env.PROD;
const isDebug = import.meta.env.VITE_DEBUG === 'true';

// Log history for debugging (keeps last 100 entries)
const logHistory: LogEntry[] = [];
const MAX_LOG_HISTORY = 100;

const addToHistory = (entry: LogEntry) => {
  logHistory.push(entry);
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift();
  }
};

const formatMessage = (level: LogLevel, source: string | undefined, message: string): string => {
  const timestamp = new Date().toISOString();
  const prefix = source ? `[${source}]` : '';
  return `${timestamp} [${level.toUpperCase()}]${prefix} ${message}`;
};

const shouldLog = (level: LogLevel): boolean => {
  if (isProd) {
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }
  if (level === 'debug') {
    // Debug logs only when explicitly enabled
    return isDebug;
  }
  return true;
};

/**
 * Create a logger instance with an optional source identifier
 */
export const createLogger = (source?: string) => ({
  debug: (message: string, data?: any) => {
    const entry: LogEntry = { level: 'debug', message, data, timestamp: new Date(), source };
    addToHistory(entry);
    
    if (shouldLog('debug')) {
      if (data !== undefined) {
        console.log(formatMessage('debug', source, message), data);
      } else {
        console.log(formatMessage('debug', source, message));
      }
    }
  },

  info: (message: string, data?: any) => {
    const entry: LogEntry = { level: 'info', message, data, timestamp: new Date(), source };
    addToHistory(entry);
    
    if (shouldLog('info')) {
      if (data !== undefined) {
        console.info(formatMessage('info', source, message), data);
      } else {
        console.info(formatMessage('info', source, message));
      }
    }
  },

  warn: (message: string, data?: any) => {
    const entry: LogEntry = { level: 'warn', message, data, timestamp: new Date(), source };
    addToHistory(entry);
    
    if (shouldLog('warn')) {
      if (data !== undefined) {
        console.warn(formatMessage('warn', source, message), data);
      } else {
        console.warn(formatMessage('warn', source, message));
      }
    }
  },

  error: (message: string, error?: any) => {
    const entry: LogEntry = { level: 'error', message, data: error, timestamp: new Date(), source };
    addToHistory(entry);
    
    // Always log errors
    if (error !== undefined) {
      console.error(formatMessage('error', source, message), error);
    } else {
      console.error(formatMessage('error', source, message));
    }
  },
});

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Get log history for debugging
 */
export const getLogHistory = (): LogEntry[] => [...logHistory];

/**
 * Clear log history
 */
export const clearLogHistory = () => {
  logHistory.length = 0;
};

/**
 * Export logs as JSON string (useful for bug reports)
 */
export const exportLogs = (): string => {
  return JSON.stringify(logHistory, null, 2);
};

// Attach to window for debugging in development
if (!isProd && typeof window !== 'undefined') {
  (window as any).__appLogs = {
    getHistory: getLogHistory,
    clear: clearLogHistory,
    export: exportLogs,
  };
}
