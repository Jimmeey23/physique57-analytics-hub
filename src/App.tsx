
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UniversalLoader } from "@/components/ui/UniversalLoader";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { GlobalCommandPalette } from "@/components/ui/GlobalCommandPalette";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";
import { GlobalFiltersProvider } from "@/contexts/GlobalFiltersContext";
import { SectionNavigationProvider } from "@/contexts/SectionNavigationContext";
import PrefetchOnIdle from "@/components/perf/PrefetchOnIdle";
import HashJumpOnLoad from "@/components/perf/HashJumpOnLoad";
import InitialLoadGate, { useInitialLoad } from "@/components/perf/InitialLoadGate";
import ForceTopOnLoad from "@/components/perf/ForceTopOnLoad";

// Optimized lazy loading with preloading for critical pages
const Index = React.lazy(() => 
  import("./pages/Index").then(module => ({ default: module.default }))
);
const ExecutiveSummary = React.lazy(() => 
  import("./pages/ExecutiveSummary").then(module => ({ default: module.default }))
);
const SalesAnalytics = React.lazy(() => 
  import("./pages/SalesAnalytics").then(module => ({ default: module.default }))
);
const FunnelLeads = React.lazy(() => 
  import("./pages/FunnelLeads").then(module => ({ default: module.default }))
);
const ClientRetention = React.lazy(() => 
  import("./pages/ClientRetention").then(module => ({ default: module.default }))
);
const TrainerPerformance = React.lazy(() => 
  import("./pages/TrainerPerformance").then(module => ({ default: module.default }))
);
const ClassAttendance = React.lazy(() => 
  import("./pages/ClassAttendance").then(module => ({ default: module.default }))
);
const ClassFormatsComparison = React.lazy(() => 
  import("./pages/ClassFormatsComparison").then(module => ({ default: module.default }))
);
const DiscountsPromotions = React.lazy(() => 
  import("./pages/DiscountsPromotions").then(module => ({ default: module.default }))
);
const Sessions = React.lazy(() => 
  import("./pages/Sessions").then(module => ({ default: module.default }))
);
const ExpirationAnalytics = React.lazy(() => 
  import("./pages/ExpirationAnalytics").then(module => ({ default: module.default }))
);
const LateCancellations = React.lazy(() => 
  import("./pages/LateCancellations").then(module => ({ default: module.default }))
);
const HeroDemo = React.lazy(() => 
  import("./pages/HeroDemo").then(module => ({ default: module.default }))
);
const GeminiAIDemoPage = React.lazy(() => 
  import("./pages/GeminiAIDemo").then(module => ({ default: module.default }))
);
const GeminiEnhancementTest = React.lazy(() => 
  import("./components/test/GeminiEnhancementTest").then(module => ({ default: module.default }))
);
const NotFound = React.lazy(() => 
  import("./pages/NotFound").then(module => ({ default: module.default }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes (increased for better caching)
      gcTime: 60 * 60 * 1000,    // 60 minutes (increased cache retention)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      networkMode: 'online',
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

const App = () => {
  usePerformanceOptimization();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GlobalFiltersProvider>
          <SectionNavigationProvider>
          <ForceTopOnLoad />
          <PrefetchOnIdle />
          <HashJumpOnLoad />
          <GlobalLoader />
          <GlobalCommandPalette />
          <InitialLoadGate>
            <React.Suspense fallback={<div />}> {/* Minimal fallback; we show InitialLoadGate overlay */}
              <FirstRouteReady>
                <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/executive-summary" element={<ExecutiveSummary />} />
              <Route path="/sales-analytics" element={<SalesAnalytics />} />
              <Route path="/funnel-leads" element={<FunnelLeads />} />
              <Route path="/client-retention" element={<ClientRetention />} />
              <Route path="/trainer-performance" element={<TrainerPerformance />} />
              <Route path="/class-attendance" element={<ClassAttendance />} />
              <Route path="/class-formats" element={<ClassFormatsComparison />} />
              <Route path="/powercycle-vs-barre" element={<ClassFormatsComparison />} />
              <Route path="/discounts-promotions" element={<DiscountsPromotions />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/expiration-analytics" element={<ExpirationAnalytics />} />
              <Route path="/late-cancellations" element={<LateCancellations />} />
              <Route path="/hero-demo" element={<HeroDemo />} />
              <Route path="/gemini-ai-demo" element={<GeminiAIDemoPage />} />
              <Route path="/gemini-test" element={<GeminiEnhancementTest />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
                </Routes>
              </FirstRouteReady>
            </React.Suspense>
          </InitialLoadGate>
          </SectionNavigationProvider>
        </GlobalFiltersProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;

function FirstRouteReady({ children }: { children: React.ReactNode }) {
  const { markRouteReady } = useInitialLoad();
  React.useEffect(() => {
    // Signal that our first route content tree has mounted
    const t = setTimeout(() => markRouteReady(), 0);
    return () => clearTimeout(t);
  }, [markRouteReady]);
  return <>{children}</>;
}