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
    react({
      // SWC plugin options to ensure proper React handling
      jsxImportSource: 'react',
    }),
    mode === 'development' && componentTagger(),
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
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    
    sourcemap: true,
    minify: 'esbuild',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Simplified chunking strategy to avoid forwardRef issues
        manualChunks: (id) => {
          // Group all Radix UI together to ensure consistent React version
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          // React and its dependencies in one chunk
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/client-only')) {
            return 'react-vendor';
          }
          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      // Ensure proper handling of React dependencies
      external: (id) => {
        // Don't externalize React and related packages in production
        if (mode === 'production') return false;
        return false;
      },
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2020',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@radix-ui/react-slot',
      '@radix-ui/react-primitive',
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-label',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
    ],
    // Force optimization of Radix UI packages
    force: true,
    // Add this to ensure proper handling of dependencies
    exclude: [],
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    treeShaking: true,
    legalComments: 'none',
  }
}));