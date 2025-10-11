
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

// Lazy load pages for better performance
const Index = React.lazy(() => import("./pages/Index"));
const ExecutiveSummary = React.lazy(() => import("./pages/ExecutiveSummary"));
const SalesAnalytics = React.lazy(() => import("./pages/SalesAnalytics"));
const FunnelLeads = React.lazy(() => import("./pages/FunnelLeads"));
const ClientRetention = React.lazy(() => import("./pages/ClientRetention"));
const TrainerPerformance = React.lazy(() => import("./pages/TrainerPerformance"));
const ClassAttendance = React.lazy(() => import("./pages/ClassAttendance"));
const ClassFormatsComparison = React.lazy(() => import("./pages/ClassFormatsComparison"));
const DiscountsPromotions = React.lazy(() => import("./pages/DiscountsPromotions"));
const Sessions = React.lazy(() => import("./pages/Sessions"));
const PowerCycleVsBarre = React.lazy(() => import("./pages/PowerCycleVsBarre"));
const ExpirationAnalytics = React.lazy(() => import("./pages/ExpirationAnalytics"));
const LateCancellations = React.lazy(() => import("./pages/LateCancellations"));
const HeroDemo = React.lazy(() => import("./pages/HeroDemo"));
const GeminiAIDemoPage = React.lazy(() => import("./pages/GeminiAIDemo"));
const GeminiEnhancementTest = React.lazy(() => import("./components/test/GeminiEnhancementTest"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
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
              <Route path="/discounts-promotions" element={<DiscountsPromotions />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/powercycle-vs-barre" element={<PowerCycleVsBarre />} />
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