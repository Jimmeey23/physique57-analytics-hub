import React from 'react';
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

export const DashboardGrid: React.FC<DashboardGridProps> = ({ onButtonClick }) => {
  const dashboardSections = [
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
      id: 'class-performance-series',
      title: 'Class Performance Series',
      description: 'Detailed class format performance analysis',
      icon: Calendar,
      color: 'from-cyan-500 to-cyan-600',
      hoverColor: 'hover:from-cyan-600 hover:to-cyan-700'
    },
    {
      id: 'class-formats',
      title: 'Class Formats Comparison',
      description: 'PowerCycle vs Barre vs Strength head-to-head metrics',
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
      id: 'powercycle-vs-barre',
      title: 'powerCycle Vs Barre Vs Strength',
      description: 'Comparative analysis of PowerCycle, Barre, and Strength classes',
      icon: Activity,
      color: 'from-violet-500 to-violet-600',
      hoverColor: 'hover:from-violet-600 hover:to-violet-700'
    },
    {
      id: 'expiration-analytics',
      title: 'Expirations & Churn',
      description: 'Membership expirations and customer retention analysis',
      icon: Calendar,
      color: 'from-amber-500 to-amber-600',
      hoverColor: 'hover:from-amber-600 hover:to-amber-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
      {dashboardSections.map((section) => {
        const IconComponent = section.icon;
        return (
          <Card 
            key={section.id}
            className="group cursor-pointer relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-3 hover:rotate-1 transform-gpu"
            onClick={() => onButtonClick(section.id)}
          >
            {/* Animated Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
            
            {/* Subtle Border Animation */}
            <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 -z-10`} />
            
            <CardHeader className="pb-4 relative z-10">
              {/* Icon Container with Advanced Animation */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.color} ${section.hoverColor} flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 shadow-lg group-hover:shadow-2xl`}>
                <IconComponent className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
                
                {/* Animated Ring */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-30 animate-ping`} />
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
};