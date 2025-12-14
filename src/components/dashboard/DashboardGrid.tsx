import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  UserCheck, 
  Clock, 
  BarChart3,
  Target,
  Activity
} from 'lucide-react';

interface DashboardGridProps {
  onButtonClick: (sectionId: string) => void;
}

export const DashboardGrid: React.FC<DashboardGridProps> = memo(({ onButtonClick }) => {
  const dashboardSections = useMemo(() => [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      description: 'High-level business metrics and KPIs',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      id: 'sales-analytics',
      title: 'Sales Analytics',
      description: 'Revenue trends and sales performance',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      id: 'class-attendance',
      title: 'Class Attendance',
      description: 'Session attendance and capacity analysis',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
    },
    {
      id: 'trainer-performance',
      title: 'Trainer Performance',
      description: 'Individual trainer metrics and rankings',
      icon: UserCheck,
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700'
    },
    {
      id: 'client-retention',
      title: 'Client Retention',
      description: 'Member retention and conversion analysis',
      icon: Target,
      color: 'from-teal-500 to-teal-600',
      hoverColor: 'hover:from-teal-600 hover:to-teal-700'
    },
    {
      id: 'discounts-promotions',
      title: 'Discounts & Promotions',
      description: 'Discount analysis and promotional effectiveness',
      icon: BarChart3,
      color: 'from-pink-500 to-pink-600',
      hoverColor: 'hover:from-pink-600 hover:to-pink-700'
    },
    {
      id: 'funnel-leads',
      title: 'Funnel & Leads',
      description: 'Lead conversion and sales funnel analysis',
      icon: Activity,
      color: 'from-indigo-500 to-indigo-600',
      hoverColor: 'hover:from-indigo-600 hover:to-indigo-700'
    },
    {
      id: 'class-formats',
      title: 'Class Formats & Performance',
      description: 'Comprehensive PowerCycle vs Barre vs Strength analysis and comparison metrics',
      icon: BarChart3,
      color: 'from-cyan-500 to-cyan-600',
      hoverColor: 'hover:from-cyan-600 hover:to-cyan-700'
    },
    {
      id: 'late-cancellations',
      title: 'Late Cancellations',
      description: 'Analysis of late cancellations and no-shows',
      icon: Clock,
      color: 'from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700'
    },
    {
      id: 'patterns-trends',
      title: 'Patterns & Trends',
      description: 'Member visit patterns and product usage trends over time',
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-600',
      hoverColor: 'hover:from-indigo-600 hover:to-purple-700'
    },
    {
      id: 'expiration-analytics',
      title: 'Expirations & Churn',
      description: 'Membership expirations and customer retention analysis',
      icon: Calendar,
      color: 'from-amber-500 to-amber-600',
      hoverColor: 'hover:from-amber-600 hover:to-amber-700'
    },
    {
      id: 'outlier-analysis',
      title: 'Outlier Analysis',
      description: 'Deep dive into April & August 2025 exceptional performance',
      icon: TrendingUp,
      color: 'from-indigo-500 to-pink-600',
      hoverColor: 'hover:from-indigo-600 hover:to-pink-700'
    }
  ], []);

  const handleCardClick = useCallback((sectionId: string) => {
    onButtonClick(sectionId);
  }, [onButtonClick]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
      {dashboardSections.map((section) => {
        const IconComponent = section.icon;
        return (
          <Card 
            key={section.id}
            className={`group cursor-pointer relative overflow-hidden bg-white/90 border border-slate-200/70 ring-1 ring-white/70 shadow-lg hover:shadow-3xl transition-all duration-500 ease-out hover:-translate-y-4 hover:scale-[1.04] transform-gpu before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-gradient-to-b ${section.color} before:opacity-80`}
            onClick={() => handleCardClick(section.id)}
            style={{
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
            }}
          >
            {/* Top accent bar removed */}

            {/* Sophisticated Animated Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-2xl`} />
            
            {/* Overlay shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/12 to-white/0 transform -skew-x-12 group-hover:animate-pulse" />
            </div>

            {/* Glow ring on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-100/0 via-blue-200/0 to-purple-200/0 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            

            
            <CardHeader className="pb-3 relative z-10 flex items-start gap-3">
              {/* Premium Icon Container - Inline */}
              <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} ${section.hoverColor} flex-shrink-0 flex items-center justify-center transition-all duration-600 group-hover:scale-115 group-hover:-translate-y-2 shadow-lg group-hover:shadow-2xl`}
                style={{
                  boxShadow: '0 6px 16px rgba(15, 23, 42, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                }}>
                <div className="absolute inset-[-10px] rounded-lg bg-white/40 blur-lg opacity-0 group-hover:opacity-80 transition-opacity duration-600" />
                <IconComponent className="w-5 h-5 text-white transition-all duration-600 group-hover:scale-120 group-hover:rotate-6" />
                
                {/* Enhanced Halo glow */}
                <div className={`absolute inset-[-2px] rounded-xl bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-600 -z-10`} />
              </div>
              
              {/* Title with High Contrast - Inline */}
              <div className="flex-1 pt-1">
                <CardTitle className="text-xl font-bold text-slate-950 group-hover:text-slate-950 transition-all duration-500 leading-tight group-hover:tracking-wide">
                  {section.title}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="pt-2 relative z-10">
              {/* Description with Sophisticated Animation */}
              <p className="text-xs text-slate-700 leading-relaxed mb-4 transition-all duration-600 group-hover:text-slate-950 group-hover:font-semibold">
                {section.description}
              </p>
              
              {/* Status + CTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-[11px] text-slate-500 transition-all duration-600 group-hover:text-emerald-600">
                  <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse group-hover:scale-125 transition-all duration-600 mr-2" />
                  <span className="font-semibold tracking-tight">Live</span>
                </div>
                
                {/* Arrow Indicator */}
                <div className={`w-7 h-7 rounded-full bg-white/90 group-hover:bg-gradient-to-br ${section.color} group-hover:bg-opacity-25 flex items-center justify-center transition-all duration-600 group-hover:translate-x-2 group-hover:scale-115 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_10px_rgba(15,23,42,0.12)] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_16px_rgba(59,130,246,0.25)]`}> 
                  <svg className="w-3.5 h-3.5 text-slate-700 group-hover:text-white transition-all duration-600 group-hover:scale-120" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});