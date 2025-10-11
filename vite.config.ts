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
    },
  },
  define: {
    // Ensure React is available globally for forwardRef
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    global: 'globalThis',
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      external: (_id) => {
        // Don't externalize any dependencies - bundle them all
        return false;
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Move recharts to vendor chunk to avoid circular dependency issues
            // Keep core libraries (React, recharts, lucide-react) together
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }
            // Keep React, React-DOM, React Router, recharts, lucide-react, framer-motion, and Radix UI together in vendor chunk
            // This prevents React import resolution issues and circular dependencies
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            return 'vendor';
          }
          
          if (id.includes('/components/dashboard/')) {
            return 'dashboard';
          }
          
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
          
          if (id.includes('/pages/')) {
            return 'pages';
          }
          
          if (id.includes('/hooks/') || id.includes('/utils/')) {
            return 'utils';
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
    target: 'es2015',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
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
      '@tanstack/react-query'
    ],
    exclude: [],
    force: true,
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    treeShaking: true,
  }
}));
;
