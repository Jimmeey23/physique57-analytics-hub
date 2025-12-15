
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { UniversalLoader } from "@/components/ui/UniversalLoader";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { GlobalCommandPalette } from "@/components/ui/GlobalCommandPalette";
import { PageTransition } from "@/components/ui/PageTransition";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";
import { useRouteChangeLoader } from "@/hooks/useRouteChangeLoader";
import { GlobalFiltersProvider } from "@/contexts/GlobalFiltersContext";
import { MetricsTablesRegistryProvider } from '@/contexts/MetricsTablesRegistryContext';
import { SectionNavigationProvider } from "@/contexts/SectionNavigationContext";
import { RouteLoadingWrapper } from "@/components/RouteLoadingWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";

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
const OutlierAnalysis = React.lazy(() => 
  import("./pages/OutlierAnalysis").then(module => ({ default: module.default }))
);
const ExpirationAnalytics = React.lazy(() => 
  import("./pages/ExpirationAnalytics").then(module => ({ default: module.default }))
);
const LateCancellations = React.lazy(() => 
  import("./pages/LateCancellations").then(module => ({ default: module.default }))
);
const PatternsAndTrends = React.lazy(() => 
  import("./pages/PatternsAndTrends").then(module => ({ default: module.default }))
);
const LocationReport = React.lazy(() => 
  import("./pages/LocationReport").then(module => ({ default: module.default }))
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

// Inner component that uses the route change loader hook
const AppRoutes = () => {
  useRouteChangeLoader();
  
  return (
    <>
      <GlobalLoader />
      <GlobalCommandPalette />
      <RouteLoadingWrapper>
        <React.Suspense fallback={<div className="fixed inset-0 z-[9999] bg-white" />}>
          <PageTransition>
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
              <Route path="/outlier-analysis" element={<OutlierAnalysis />} />
              <Route path="/expiration-analytics" element={<ExpirationAnalytics />} />
              <Route path="/late-cancellations" element={<LateCancellations />} />
              <Route path="/patterns-trends" element={<PatternsAndTrends />} />
              <Route path="/location-report" element={<LocationReport />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </React.Suspense>
      </RouteLoadingWrapper>
    </>
  );
};

const App = () => {
  usePerformanceOptimization();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GlobalFiltersProvider>
              <MetricsTablesRegistryProvider>
                <SectionNavigationProvider>
                  <AppRoutes />
                </SectionNavigationProvider>
              </MetricsTablesRegistryProvider>
            </GlobalFiltersProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;