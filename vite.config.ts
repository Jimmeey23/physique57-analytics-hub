import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import notesHandler from "./api/notes.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react({
      jsxImportSource: "react",
    }),
    mode === "development" && componentTagger(),

    // Local API middleware for /api/notes
    mode === "development" && {
      name: "local-api-notes",
      configureServer(server: ViteDevServer) {
        server.middlewares.use("/api/notes", (req: any, res: any, next: any) => {
          if (!["GET", "POST"].includes(req.method)) return next();

          try {
            const url = new URL(req.url || "", "http://localhost");
            (req as any).query = Object.fromEntries(url.searchParams.entries());
          } catch {
            (req as any).query = {};
          }

          const wrapResponse = (res: any) =>
            Object.assign(res, {
              status(code: number) {
                res.statusCode = code;
                return res;
              },
              json(obj: any) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(obj));
              },
            });

          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk: any) => (body += chunk));
            req.on("end", async () => {
              try {
                (req as any).body = body ? JSON.parse(body) : {};
              } catch {
                (req as any).body = {};
              }
              Promise.resolve(notesHandler(req, wrapResponse(res))).catch((err: any) => {
                console.error("Local /api/notes error", err);
                wrapResponse(res).status(500).json({ error: "Internal server error" });
              });
            });
            return;
          }

          Promise.resolve(notesHandler(req, wrapResponse(res))).catch((err: any) => {
            console.error("Local /api/notes error", err);
            wrapResponse(res).status(500).json({ error: "Internal server error" });
          });
        });
      },
    },
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // 👇 These two ensure every library (Radix, ShadCN, Lucide, etc.)
      // uses the exact same React instance.
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },

  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },

  build: {
    sourcemap: true, // <-- important for debugging Vercel errors
    minify: "esbuild",
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    target: "es2020",
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // ✅ Let Vite automatically decide chunking
        // (manualChunks can isolate React inside radix-ui bundle, breaking forwardRef)
        manualChunks: undefined,

        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@radix-ui/react-slot",
      "@radix-ui/react-primitive",
    ],
    force: true,
  },

  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
    treeShaking: true,
    legalComments: "none",
  },
}));