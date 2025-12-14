import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/ui/footer';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { designTokens } from '@/utils/designTokens';
import { AiNotes } from '@/components/ui/AiNotes';

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
  subtitle
}: {
  title: string;
  subtitle: string;
}) => <div className="relative p-6 rounded-2xl bg-white border border-slate-200/60 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-purple-50/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">{title}</div>
      <div className="text-xs text-slate-500 font-medium mt-1">{subtitle}</div>
    </div>
    <div className="absolute top-3 right-3 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 animate-pulse"></div>
  </div>);
const Index = memo(() => {
  const navigate = useNavigate();
  
  // Wrap hook usage in try-catch to prevent context errors
  let globalLoadingHook;
  let googleSheetsHook;
  
  try {
    globalLoadingHook = useGlobalLoading();
    googleSheetsHook = useGoogleSheets();
  } catch (error) {
    console.error('Hook initialization error:', error);
    // Return a fallback UI
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="p-12 bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl max-w-lg">
          <CardContent className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <p className="text-xl font-semibold text-slate-800">Application Error</p>
              <p className="text-sm text-slate-600 mt-2">There was an issue loading the application. Please refresh the page.</p>
            </div>
            <Button onClick={() => window.location.reload()} className="gap-2 bg-slate-800 hover:bg-slate-900 text-white">
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { setLoading } = globalLoadingHook;
  const { data, loading, error, refetch } = googleSheetsHook;

  const memoizedData = useMemo(() => data, [data]);

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
  return <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/50 to-white relative overflow-hidden">
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
          <header className="mb-12 text-center slide-in-from-left">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 text-slate-900 px-6 py-2.5 text-xs font-semibold shadow-sm tracking-widest border border-slate-200/60 rounded-full">
                BUSINESS INTELLIGENCE DASHBOARD
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-3 tracking-tight text-center perspective-tilt px-6 md:px-12 lg:px-16">
              <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent font-black">Physique</span>{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black">57</span>
              <span className="text-slate-700 font-black"> , India</span>
            </h1>
            
            <p className="text-lg text-slate-700 font-semibold mb-12 max-w-4xl mx-auto leading-relaxed mt-6 slide-in-right stagger-1">
              Comprehensive fitness analytics platform delivering actionable intelligence through advanced data visualization and real-time performance metrics
            </p>
            
            {/* Premium Stats Cards */}
            <div className="flex flex-wrap justify-center gap-5 mb-10">
              <div className="glass-card modern-card-hover soft-bounce stagger-1">
                <div className="relative px-6 py-4 rounded-xl bg-white border border-slate-200/80 transform hover:scale-110 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Live</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">Updates</div>
                  </div>
                  <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full opacity-60 animate-pulse"></div>
                </div>
              </div>
              <div className="glass-card modern-card-hover soft-bounce stagger-2">
                <div className="relative px-6 py-4 rounded-xl bg-white border border-slate-200/80 transform hover:scale-110 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">12</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">Modules</div>
                  </div>
                  <div className="absolute top-3 right-3 w-2 h-2 bg-purple-500 rounded-full opacity-60 animate-pulse"></div>
                </div>
              </div>
              <div className="glass-card modern-card-hover soft-bounce stagger-3">
                <div className="relative px-6 py-4 rounded-xl bg-white border border-slate-200/80 transform hover:scale-110 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">100%</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">Accuracy</div>
                  </div>
                  <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full opacity-60 animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mb-6 shimmer-effect rounded-full"></div>
          </header>

          {/* Premium Dashboard Grid */}
          <main className="max-w-7xl mx-auto slide-in-from-right stagger-2">
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
          </main>
        </div>
      </div>
      
      <Footer />
      
      <style>{`
        @keyframes color-cycle {
          0% { color: #3b82f6; }
          25% { color: #ef4444; }
          50% { color: #6366f1; }
          75% { color: #8b5cf6; }
          100% { color: #3b82f6; }
        }
        
        .animate-color-cycle {
          animation: color-cycle 4s infinite ease-in-out;
        }
      `}</style>
    </div>;
});

export default Index;