// React global shim for production builds
import * as ReactNamespace from 'react';

// Ensure React is available on window/globalThis for UI components
if (typeof window !== 'undefined') {
  (window as any).React = ReactNamespace;
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).React = ReactNamespace;
}

// Re-export all React exports
export * from 'react';
export { ReactNamespace as default };