
import React from 'react';
import { ExecutiveSummarySection } from '@/components/dashboard/ExecutiveSummarySection';
import { Footer } from '@/components/ui/footer';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';

const ExecutiveSummary = () => {
  return (
    <GlobalFiltersProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
        <DashboardMotionHero
          title="Executive Overview"
          subtitle="A concise, high-level view of revenue, attendance, and growth trends across all locations."
          metrics={[]}
        />
        <ExecutiveSummarySection />
        <Footer />
      </div>
    </GlobalFiltersProvider>
  );
};

export default ExecutiveSummary;
