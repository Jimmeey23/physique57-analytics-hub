import * as React from "react";
import { useLocation } from "react-router-dom";

// Prefetch route chunks during idle time to accelerate subsequent navigations.
// Non-invasive: uses requestIdleCallback when available, and only imports route modules.

const routesToPrefetch = [
  "/",
  "/executive-summary",
  "/sales-analytics",
  "/funnel-leads",
  "/client-retention",
  "/trainer-performance",
  "/class-attendance",
  "/class-formats",
  "/discounts-promotions",
  "/sessions",
  "/powercycle-vs-barre",
  "/expiration-analytics",
  "/late-cancellations",
  "/hero-demo",
  "/gemini-ai-demo",
];

// Map routes to their corresponding page module paths
const routeToModule: Record<string, string> = {
  "/": "/src/pages/Index.tsx",
  "/executive-summary": "/src/pages/ExecutiveSummary.tsx",
  "/sales-analytics": "/src/pages/SalesAnalytics.tsx",
  "/funnel-leads": "/src/pages/FunnelLeads.tsx",
  "/client-retention": "/src/pages/ClientRetention.tsx",
  "/trainer-performance": "/src/pages/TrainerPerformance.tsx",
  "/class-attendance": "/src/pages/ClassAttendance.tsx",
  "/class-formats": "/src/pages/ClassFormatsComparison.tsx",
  "/discounts-promotions": "/src/pages/DiscountsPromotions.tsx",
  "/sessions": "/src/pages/Sessions.tsx",
  "/powercycle-vs-barre": "/src/pages/PowerCycleVsBarre.tsx",
  "/expiration-analytics": "/src/pages/ExpirationAnalytics.tsx",
  "/late-cancellations": "/src/pages/LateCancellations.tsx",
  "/hero-demo": "/src/pages/HeroDemo.tsx",
  "/gemini-ai-demo": "/src/pages/GeminiAIDemo.tsx",
};

// Create a lazy import map for all pages (code-split aware)
const pageModules = import.meta.glob('/src/pages/*.tsx');

export function PrefetchOnIdle() {
  const location = useLocation();

  React.useEffect(() => {
    const idle = (cb: () => void) => {
      // @ts-ignore
      if (window.requestIdleCallback) return window.requestIdleCallback(cb, { timeout: 2000 });
      const id = window.setTimeout(cb, 300);
      return id as unknown as number;
    };
    const cancel = (id: number) => {
      // @ts-ignore
      if (window.cancelIdleCallback) return window.cancelIdleCallback(id);
      clearTimeout(id);
    };

    const id = idle(async () => {
      try {
        const next = routesToPrefetch.filter((r) => r !== location.pathname).slice(0, 4);
        const loaders = next
          .map((route) => routeToModule[route])
          .map((path) => (path ? pageModules[path] : undefined))
          .filter(Boolean) as Array<() => Promise<unknown>>;
        await Promise.all(loaders.map((load) => load().catch(() => null)));
      } catch {
        // ignore
      }
    });
    return () => cancel(id);
  }, [location.pathname]);

  return null;
}

export default PrefetchOnIdle;
