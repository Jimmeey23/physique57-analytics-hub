
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { PowerCycleVsBarreSection } from '@/components/dashboard/PowerCycleVsBarreSection';
import { SessionsFiltersProvider } from '@/contexts/SessionsFiltersContext';
import { Footer } from '@/components/ui/footer';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { SimplePresenterMode } from '@/components/presentation/SimplePresenterMode';
import { Button } from '@/components/ui/button';
import { Presentation } from 'lucide-react';
import { AiNotes } from '@/components/ui/AiNotes';

const PowerCycleVsBarre = () => {
  const { data: payrollData, isLoading: loading } = usePayrollData();
  const { isLoading, setLoading } = useGlobalLoading();
  const exportRef = React.useRef<{ open: () => void }>(null);
  const [isPresenterMode, setIsPresenterMode] = useState(false);

  useEffect(() => {
    if (loading !== undefined) {
      setLoading(loading, 'Loading PowerCycle vs Barre vs Strength performance data...');
    }
  }, [loading, setLoading]);

  // Remove individual loader - rely on global loader only

  // Compute compact hero metrics (sessions, revenue, avg fill)
  const totals = React.useMemo(() => {
    const d = payrollData || [];
    const sum = (key: keyof typeof d[number]) => d.reduce((acc, it) => acc + (Number(it[key] as any) || 0), 0);
    const sessions = sum('cycleSessions') + sum('barreSessions') + sum('strengthSessions');
    const empty = sum('emptyCycleSessions') + sum('emptyBarreSessions') + sum('emptyStrengthSessions');
    const revenue = sum('cyclePaid') + sum('barrePaid') + sum('strengthPaid');
    const fill = sessions > 0 ? ((sessions - empty) / sessions) * 100 : 0;
    return { sessions, revenue, fill };
  }, [payrollData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-purple-50/40 to-pink-50/30 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-white/30 backdrop-blur-[0.5px]"></div>
      <div className="relative z-10">
      <DashboardMotionHero 
        title="PowerCycle vs Barre vs Strength"
        subtitle="Comprehensive analysis of PowerCycle, Barre, and Strength Lab class performance"
        metrics={[
          { label: 'Total Sessions', value: `${totals.sessions.toLocaleString()}` },
          { label: 'Total Revenue', value: `₹${totals.revenue.toLocaleString()}` },
          { label: 'Avg Fill', value: `${totals.fill.toFixed(1)}%` },
        ]}
        onDashboardClick={() => {
          const main = document.querySelector('main, .container');
          if (main) (main as HTMLElement).scrollIntoView({ behavior: 'smooth' });
        }}
        onExportClick={() => exportRef.current?.open()}
        extra={
          <Button
            onClick={() => setIsPresenterMode(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Presentation className="w-5 h-5" />
            Presenter Mode
          </Button>
        }
      />

      {/* Hidden export dialog controlled from the hero */}
      <AdvancedExportButton 
        renderTrigger={false}
        openRef={exportRef as any}
        payrollData={payrollData || []}
        defaultFileName={`powercycle-barre-strength-export`}
      />

      <div className="container mx-auto px-6 py-8">
        <main className="space-y-8">
          <SessionsFiltersProvider>
            <PowerCycleVsBarreSection data={payrollData || []} />
          </SessionsFiltersProvider>
          
          <div className="mt-8">
            <AiNotes 
              location="powercycle-vs-barre"
              sectionId="comparison-analytics" 
              tableKey="powercycle-barre-strength-main"
              author="Format Comparison Analyst"
            />
          </div>
        </main>
      </div>
      
      <Footer />
      
      {/* Presenter Mode */}
      <SimplePresenterMode 
        isOpen={isPresenterMode}
        onClose={() => setIsPresenterMode(false)}
      />
      </div>
    </div>
  );
};

export default PowerCycleVsBarre;
