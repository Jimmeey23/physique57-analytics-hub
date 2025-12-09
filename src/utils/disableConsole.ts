// disableConsole.ts
// Silences console.log in production builds to avoid noisy output and minor perf overhead.
// This is intentionally minimal and reversible; it only affects `console.log`.

if (import.meta.env && import.meta.env.PROD) {
  try {
    // Keep references to original methods in case they're needed later
    const _originalConsole = {
      log: console.log.bind(console),
    };

    // Replace console.log with a noop in production
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    console.log = () => {};

    // Optionally expose original console for debugging via window (devtools)
    if (typeof window !== 'undefined') {
      (window as any).__originalConsole = _originalConsole;
    }
  } catch (err) {
    // If anything goes wrong, do not block the app—leave console as-is
  }
}
