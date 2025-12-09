import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryProvider } from './providers/QueryProvider'
// Load production console guards early to silence noisy dev logs in production builds
import './utils/disableConsole';

createRoot(document.getElementById("root")!).render(
  // Temporarily disable StrictMode to prevent context initialization issues during development
  // <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  // </React.StrictMode>
);
