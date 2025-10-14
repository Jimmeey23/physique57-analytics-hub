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
      id: 'expiration-analytics',
      title: 'Expirations & Churn',
      description: 'Membership expirations and customer retention analysis',
      icon: Calendar,
      color: 'from-amber-500 to-amber-600',
      hoverColor: 'hover:from-amber-600 hover:to-amber-700'
    }
  ], []);

  const handleCardClick = useCallback((sectionId: string) => {
    onButtonClick(sectionId);
  }, [onButtonClick]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
      {dashboardSections.map((section) => {
        const IconComponent = section.icon;
        return (
          <Card 
            key={section.id}
            className="group cursor-pointer relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-700 ease-out hover:-translate-y-4 hover:scale-105 transform-gpu"
            onClick={() => handleCardClick(section.id)}
            style={{
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            }}
          >
            {/* Modern Animated Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-15 transition-all duration-700 rounded-2xl`} />
            
            {/* Enhanced Glow Effect */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-25 blur-2xl transition-all duration-700 -z-10 scale-110`} />
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
            </div>
            
            <CardHeader className="pb-4 relative z-10">
              {/* Enhanced Icon Container with Modern Animation */}
              <div className={`relative w-16 h-16 rounded-3xl bg-gradient-to-br ${section.color} ${section.hoverColor} flex items-center justify-center mb-6 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 shadow-xl group-hover:shadow-2xl`}
                style={{
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}>
                <IconComponent className="w-8 h-8 text-white transition-transform duration-500 group-hover:scale-110 drop-shadow-sm" />
                
                {/* Enhanced Animated Rings */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-40 animate-ping scale-110`} />
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-20 animate-pulse scale-125`} />
              </div>
              
              {/* Title with Gradient Text Animation */}
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 leading-tight">
                {section.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0 relative z-10">
              {/* Description with Fade Animation */}
              <p className="text-sm text-gray-600 leading-relaxed mb-4 transition-colors duration-300 group-hover:text-gray-700">
                {section.description}
              </p>
              
              {/* Status Indicator with Pulse */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full mr-2 animate-pulse shadow-sm shadow-emerald-400/50 group-hover:animate-bounce" />
                  <span className="font-medium group-hover:text-emerald-600 transition-colors">Active</span>
                </div>
                
                {/* Arrow Indicator */}
                <div className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                  <svg className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              {/* Animated Bottom Border */}
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${section.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full`} />
            </CardContent>
            
            {/* Floating Particles Effect */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-100" />
              <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-200 mt-1 ml-2" />
              <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-300 mt-1" />
            </div>
          </Card>
        );
      })}
    </div>
  );
});