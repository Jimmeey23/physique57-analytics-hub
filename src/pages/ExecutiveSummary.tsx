
import React from 'react';
import { ExecutiveSummarySection } from '@/components/dashboard/ExecutiveSummarySection';
import { Footer } from '@/components/ui/footer';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { FileText, Download, Home, Play, Pause } from 'lucide-react';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/utils/formatters';

const ExecutiveSummary = () => {
  // Gather data for export
  const { data: salesData = [] } = useSalesData();
  const { data: sessionsData = [] } = useSessionsData();
  const { data: payrollData = [] } = usePayrollData();
  const { data: newClientData = [] } = useNewClientData();
  const { data: leadsData = [] } = useLeadsData();
  const { data: discountData = [] } = useDiscountAnalysis();
  const exportRef = React.useRef<{ open: () => void }>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Calculate hero metrics from last month's data
  const heroMetrics = React.useMemo(() => {
    // Filter to previous month
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isInPreviousMonth = (dateStr: string) => {
      const date = new Date(dateStr);
      return date >= previousMonth && date < currentMonth;
    };

    const lastMonthSales = salesData.filter(s => isInPreviousMonth(s.paymentDate));
    const lastMonthSessions = sessionsData.filter(s => isInPreviousMonth(s.date));
    const lastMonthLeads = leadsData.filter(l => l.createdAt && isInPreviousMonth(l.createdAt));

    const totalRevenue = lastMonthSales.reduce((sum, sale) => sum + (sale.paymentValue || 0), 0);
    const activeMembers = new Set(lastMonthSales.map(s => s.memberId)).size;
    const totalAttendance = lastMonthSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const convertedLeads = lastMonthLeads.filter(l => l.conversionStatus === 'Converted').length;
    const conversionRate = lastMonthLeads.length > 0 ? (convertedLeads / lastMonthLeads.length) * 100 : 0;

    return [
      { label: 'Total Revenue', value: formatCurrency(totalRevenue), trend: null },
      { label: 'Active Members', value: formatNumber(activeMembers), trend: null },
      { label: 'Session Attendance', value: formatNumber(totalAttendance), trend: null },
      { label: 'Lead Conversion', value: `${conversionRate.toFixed(1)}%`, trend: null }
    ];
  }, [salesData, sessionsData, leadsData]);

  return (
    <GlobalFiltersProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
        <DashboardMotionHero
          title="Executive Overview"
          subtitle="A concise, high-level view of revenue, attendance, and growth trends across all locations."
          metrics={heroMetrics}
          extra={
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsPlaying(p => !p)}
                className="rounded-xl border border-white/30 bg-transparent text-white hover:border-white/50 px-4 py-2 text-sm font-semibold"
                variant="ghost"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button 
                onClick={() => exportRef.current?.open()}
                className="rounded-xl border border-white/30 bg-transparent text-white hover:border-white/50 px-4 py-2 text-sm font-semibold"
                variant="ghost"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>
              <Button
                onClick={() => document.getElementById('exec-pdf-trigger')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                className="rounded-xl border border-white/30 bg-transparent text-white hover:border-white/50 px-4 py-2 text-sm font-semibold"
                variant="ghost"
              >
                <FileText className="w-4 h-4 mr-2" />
                Download PDF Reports
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                className="rounded-xl border border-white/30 bg-transparent text-white hover:border-white/50 px-4 py-2 text-sm font-semibold"
                variant="ghost"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Main Dashboard
              </Button>
            </div>
          }
        />
        <ExecutiveSummarySection />

        {/* Hidden export dialog wired for programmatic open */}
        <div className="hidden">
          <AdvancedExportButton 
            renderTrigger={false}
            openRef={exportRef as any}
            salesData={salesData}
            sessionsData={sessionsData as any}
            newClientData={newClientData}
            payrollData={payrollData}
            lateCancellationsData={[]}
            discountData={discountData as any}
            defaultFileName="executive-dashboard-export"
          />
        </div>
        <Footer />
      </div>
    </GlobalFiltersProvider>
  );
};

export default ExecutiveSummary;
