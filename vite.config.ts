import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// Local import of the serverless API handler for dev middleware
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import notesHandler from "./api/notes.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Local API middleware to handle /api/notes in development
    mode === 'development' && {
      name: 'local-api-notes',
  configureServer(server: ViteDevServer) {
        server.middlewares.use('/api/notes', (req: any, res: any, next: any) => {
          // Only handle GET/POST we use; pass through others
          if (!['GET', 'POST'].includes(req.method)) return next();

          // Parse query params
          try {
            const url = new URL(req.url || '', 'http://localhost');
            (req as any).query = Object.fromEntries(url.searchParams.entries());
          } catch {
            (req as any).query = {};
          }

          // Parse JSON body for POST
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', async () => {
              try { (req as any).body = body ? JSON.parse(body) : {}; } catch { (req as any).body = {}; }
              // Wrap res with status/json helpers
              const wrapped = Object.assign(res, {
                status(code: number) { res.statusCode = code; return wrapped; },
                json(obj: any) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); }
              });
              Promise.resolve(notesHandler(req, wrapped)).catch((err: any) => {
                console.error('Local /api/notes error', err);
                wrapped.status(500).json({ error: 'Internal server error' });
              });
            });
            return;
          }

          // For GET requests
          const wrapped = Object.assign(res, {
            status(code: number) { res.statusCode = code; return wrapped; },
            json(obj: any) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); }
          });
          Promise.resolve(notesHandler(req, wrapped)).catch((err: any) => {
            console.error('Local /api/notes error', err);
            wrapped.status(500).json({ error: 'Internal server error' });
          });
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force single React instance - critical for Radix UI
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
    },
    // Force single versions of these critical packages
    dedupe: [
      'react', 
      'react-dom', 
      'react/jsx-runtime',
      '@radix-ui/react-primitive',
      '@radix-ui/react-slot',
      '@radix-ui/react-use-callback-ref',
      '@radix-ui/react-compose-refs',
    ],
  },
  define: {
    // Ensure React is available globally for forwardRef
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  build: {
    sourcemap: mode === 'production' ? false : true,
    minify: 'esbuild',
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline small assets
    rollupOptions: {
      output: {
        // Critical: Keep React, Radix UI, and chart libraries together
        manualChunks: (id) => {
          // React, Radix UI, and Recharts MUST stay together in the same chunk
          // This prevents initialization errors (forwardRef, circular dependencies)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler') ||
              id.includes('@radix-ui/') ||
              id.includes('recharts') || 
              id.includes('d3-')) {
            return 'react-vendor';
          }
          // React Query
          if (id.includes('@tanstack/react-query')) {
            return 'react-query';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          // Lucide icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // PDF generation (lazy loaded)
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'pdf-export';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name || 'chunk';
          return `assets/${name}-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
    target: 'es2020', // Modern target for better tree-shaking
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router-dom',
      'recharts',
      'date-fns',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@tanstack/react-query',
      'zustand'
    ],
    exclude: [],
    force: false, // Only force in dev when needed
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    treeShaking: true,
    legalComments: 'none', // Remove comments in production
  }
}));
;
