import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/ui/footer';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, AlertCircle, BarChart3, LayoutGrid, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { designTokens } from '@/utils/designTokens';
import { motion } from 'framer-motion';

// Error boundary wrapper for critical sections
const SafeWrapper = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('SafeWrapper caught error:', error);
    return fallback || <div>Loading...</div>;
  }
};

// Memoized stats card component
const StatsCard = memo(({
  title,
  subtitle,
  icon: IconComponent,
  accent = 'from-blue-400 to-purple-400'
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) => <div className="relative p-6 rounded-2xl bg-white border border-slate-200/60 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-purple-50/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white/90 transition-colors duration-300">
      <IconComponent className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-800 transition-colors duration-300" />
    </div>
    <div className="relative z-10">
      <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">{title}</div>
      <div className="text-xs text-slate-500 font-medium mt-1">{subtitle}</div>
    </div>
    <div className={`absolute top-3 right-3 w-2 h-2 bg-gradient-to-r ${accent} rounded-full opacity-60 animate-pulse`}></div>
  </div>);
const Index = memo(() => {
  const navigate = useNavigate();
  const { setLoading } = useGlobalLoading();
  const { data, loading, error, refetch } = useGoogleSheets();

  const memoizedData = useMemo(() => data, [data]);
  const totalRecords = memoizedData.length;
  const moduleCount = 13;

  useEffect(() => {
    setLoading(loading, 'Loading dashboard overview...');
  }, [loading, setLoading]);
  
  const handleSectionClick = useCallback((sectionId: string) => {
    if (sectionId === 'class-performance-series') {
      window.open('https://class-performance-series-001.vercel.app/', '_blank');
    } else if (sectionId === 'late-cancellations') {
      navigate('/late-cancellations');
    } else {
      navigate(`/${sectionId}`);
    }
  }, [navigate]);
  
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return null; // Global loader will handle this
  }
  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className={`p-12 ${designTokens.card.background} backdrop-blur-sm ${designTokens.card.shadow} ${designTokens.card.border} rounded-2xl max-w-lg`}>
          <CardContent className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <p className="text-xl font-semibold text-slate-800">Connection Error</p>
              <p className="text-sm text-slate-600 mt-2">{error}</p>
            </div>
            <Button onClick={handleRetry} className="gap-2 bg-slate-800 hover:bg-slate-900 text-white">
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/40 to-white"></div>
        
        {/* Subtle Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 backdrop-blur-[2px]"></div>
        
        {/* Premium Floating Elements - Subtle and Sophisticated */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-400/8 to-purple-400/6 rounded-full floating-animation stagger-1 backdrop-blur-md border border-slate-200/30 shadow-lg"></div>
        <div className="absolute top-60 right-20 w-96 h-96 bg-gradient-to-br from-purple-400/6 to-pink-400/8 rounded-full floating-animation stagger-3 backdrop-blur-md border border-slate-200/30 shadow-lg"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-blue-400/5 to-cyan-400/6 rounded-full floating-animation stagger-5 backdrop-blur-md border border-slate-200/30 shadow-lg"></div>
        
        {/* Premium Floating Orbs - Subtle Accents */}
        <div className="absolute top-32 right-1/4 w-28 h-28 bg-gradient-to-br from-blue-300/12 to-purple-300/10 rounded-full float-gentle stagger-2 backdrop-blur-md border border-slate-200/40 shadow-md"></div>
        <div className="absolute bottom-40 right-16 w-36 h-36 bg-gradient-to-br from-purple-300/10 to-pink-300/12 rounded-full float-gentle stagger-4 backdrop-blur-md border border-slate-200/40 shadow-md"></div>
        <div className="absolute top-3/4 left-20 w-24 h-24 bg-gradient-to-br from-cyan-300/10 to-blue-300/8 rounded-full float-gentle stagger-6 backdrop-blur-md border border-slate-200/40 shadow-md"></div>
        
        {/* Subtle Pulsing Elements */}
        <div className="absolute top-1/4 left-3/4 w-16 h-16 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full pulse-gentle stagger-1"></div>
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full pulse-gentle stagger-3"></div>
        <div className="absolute top-1/2 right-1/3 w-14 h-14 bg-gradient-to-r from-blue-300/15 to-purple-300/15 rounded-full pulse-gentle stagger-5"></div>
        
        {/* Morphing Shapes */}
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-200/5 to-purple-200/5 morph-shape stagger-2"></div>
        <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-gradient-to-r from-purple-200/5 to-pink-200/5 morph-shape stagger-4"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-12">
          {/* Premium Header Section */}
          <motion.header
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="dashboard-hero-header mb-12 text-center slide-in-from-left"
          >
            <div className="dashboard-hero-graphics" aria-hidden="true">
              <span className="dashboard-hero-orb dashboard-hero-orb-left floating-animation stagger-1" />
              <span className="dashboard-hero-orb dashboard-hero-orb-right floating-animation stagger-3" />
              <span className="dashboard-hero-orb dashboard-hero-orb-mid pulse-gentle stagger-2" />
              <span className="dashboard-hero-ring dashboard-hero-ring-left" />
              <span className="dashboard-hero-ring dashboard-hero-ring-right" />
            </div>

            <div className="relative z-10">
              <div className="dashboard-title-frame mb-12 mx-auto max-w-full">
                <h1 className="dashboard-main-title">
                  BUSINESS INTELLIGENCE DASHBOARD
                </h1>
                <p className="dashboard-title-subtitle">
                  PHYSIQUE 57 INDIA
                </p>
              </div>
              
              {/* Premium Stats Cards */}
              <div className="flex flex-wrap justify-center gap-5 mb-10">
                <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }} className="glass-card modern-card-hover soft-bounce stagger-1">
                  <StatsCard title={String(moduleCount)} subtitle="No of Modules" icon={LayoutGrid} accent="from-blue-400 to-cyan-400" />
                </motion.div>
                <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }} className="glass-card modern-card-hover soft-bounce stagger-2">
                  <StatsCard title={totalRecords.toLocaleString()} subtitle="Real-Time Data" icon={Activity} accent="from-purple-400 to-pink-400" />
                </motion.div>
                <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }} className="glass-card modern-card-hover soft-bounce stagger-3">
                  <StatsCard title="Advanced" subtitle="Analytics" icon={BarChart3} accent="from-emerald-400 to-teal-400" />
                </motion.div>
              </div>

              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mb-6 shimmer-effect rounded-full"></div>
            </div>
          </motion.header>

          {/* Premium Dashboard Grid */}
          <motion.main
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-7xl mx-auto slide-in-from-right stagger-2"
          >
            <div className="min-w-full bg-white border border-slate-200/60 glow-pulse rounded-3xl p-8 shadow-lg shadow-slate-200/40">
              <SafeWrapper fallback={
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 font-medium">Loading dashboard...</p>
                </div>
              }>
                <DashboardGrid onButtonClick={handleSectionClick} />
              </SafeWrapper>
            </div>
          </motion.main>
        </div>
      </div>
      
      <Footer />
    </div>;
});

export default Index;
