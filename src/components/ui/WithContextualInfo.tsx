import React from 'react';
import { ContextualInfoIcon, ContextualInfo } from '@/components/ui/ContextualInfoIcon';
import { useExternalDocumentData } from '@/hooks/useExternalDocumentData';
import { useKwalityHouseSelection } from '@/hooks/useKwalityHouseSelection';
import { ExternalDocumentData } from '@/services/externalDocumentService';

interface WithContextualInfoProps {
  children: React.ReactNode;
  dataType: keyof ExternalDocumentData;
  className?: string;
  iconPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  iconSize?: 'sm' | 'md' | 'lg';
  iconVariant?: 'default' | 'secondary' | 'outline';
  currentLocation?: string | string[];
  title?: string;
}

/**
 * Higher-order component that adds contextual info icons to any component
 * when Kwality House is selected. Automatically fetches and displays relevant data.
 */
export const WithContextualInfo: React.FC<WithContextualInfoProps> = ({
  children,
  dataType,
  className = '',
  iconPosition = 'top-right',
  iconSize = 'sm',
  iconVariant = 'outline',
  currentLocation,
  title
}) => {
  const isKwalitySelected = useKwalityHouseSelection(currentLocation);
  const { data, loading, refresh } = useExternalDocumentData({
    isKwalitySelected,
    autoRefresh: true
  });

  const getContextualInfo = (): ContextualInfo | null => {
    if (!data || !data[dataType]) return null;

    const sectionTitle = title || getDefaultTitle(dataType);

    switch (dataType) {
      case 'trainerPerformance': {
        const trainerData = data.trainerPerformance;
        if (!trainerData) return null;
        return {
          title: sectionTitle,
          metrics: trainerData.topTrainers || [],
          insights: trainerData.insights || [],
          recommendations: trainerData.recommendations || []
        };
      }
      
      case 'salesInsights': {
        const salesData = data.salesInsights;
        if (!salesData) return null;
        return {
          title: sectionTitle,
          notes: salesData.performanceNotes || [],
          trends: salesData.trends || [],
          actionItems: salesData.actionItems || []
        };
      }
      
      case 'classFormatData': {
        const formatData = data.classFormatData;
        if (!formatData) return null;
        return {
          title: sectionTitle,
          trends: formatData.popularFormats || [],
          insights: formatData.attendance || [],
          notes: formatData.feedback || []
        };
      }
      
      case 'clientRetentionData': {
        const retentionData = data.clientRetentionData;
        if (!retentionData) return null;
        return {
          title: sectionTitle,
          tips: retentionData.retentionTips || [],
          analysis: retentionData.churnAnalysis || [],
          stories: retentionData.successStories || []
        };
      }
      
      case 'sessionsData': {
        const sessionsData = data.sessionsData;
        if (!sessionsData) return null;
        return {
          title: sectionTitle,
          peakTimes: sessionsData.peakTimes || [],
          utilization: sessionsData.utilization || [],
          optimization: sessionsData.optimization || []
        };
      }
      
      case 'generalInsights': {
        const generalData = data.generalInsights;
        if (!generalData) return null;
        return {
          title: sectionTitle,
          marketTrends: generalData.marketTrends || [],
          analysis: generalData.competitorAnalysis || [],
          opportunities: generalData.opportunities || []
        };
      }

      case 'monthlyAnalysis': {
        const monthlyData = data.monthlyAnalysis;
        if (!monthlyData) return null;
        return {
          title: sectionTitle,
          trends: monthlyData.trends || [],
          insights: monthlyData.insights || [],
          recommendations: monthlyData.recommendations || [],
          keyMetrics: monthlyData.keyMetrics || []
        };
      }

      case 'yearlyAnalysis': {
        const yearlyData = data.yearlyAnalysis;
        if (!yearlyData) return null;
        return {
          title: sectionTitle,
          trends: yearlyData.trends || [],
          insights: yearlyData.insights || [],
          recommendations: yearlyData.recommendations || [],
          keyMetrics: yearlyData.keyMetrics || []
        };
      }

      case 'productPerformance': {
        const productData = data.productPerformance;
        if (!productData) return null;
        return {
          title: sectionTitle,
          insights: productData.insights || [],
          recommendations: productData.recommendations || [],
          topProducts: productData.topProducts || [],
          trends: productData.trends || []
        };
      }

      case 'categoryPerformance': {
        const categoryData = data.categoryPerformance;
        if (!categoryData) return null;
        return {
          title: sectionTitle,
          insights: categoryData.insights || [],
          recommendations: categoryData.recommendations || [],
          topCategories: categoryData.topCategories || [],
          trends: categoryData.trends || []
        };
      }

      case 'salesTeamAnalysis': {
        const teamData = data.salesTeamAnalysis;
        if (!teamData) return null;
        return {
          title: sectionTitle,
          insights: teamData.insights || [],
          recommendations: teamData.recommendations || [],
          topPerformers: teamData.topPerformers || [],
          strategies: teamData.strategies || []
        };
      }

      case 'paymentAnalysis': {
        const paymentData = data.paymentAnalysis;
        if (!paymentData) return null;
        return {
          title: sectionTitle,
          insights: paymentData.insights || [],
          recommendations: paymentData.recommendations || [],
          trends: paymentData.trends || [],
          preferences: paymentData.preferences || []
        };
      }

      case 'topBottomAnalysis': {
        const rankingData = data.topBottomAnalysis;
        if (!rankingData) return null;
        return {
          title: sectionTitle,
          insights: rankingData.insights || [],
          recommendations: rankingData.recommendations || [],
          topPerformers: rankingData.topPerformers || [],
          bottomPerformers: rankingData.bottomPerformers || [],
          strategies: rankingData.strategies || []
        };
      }
      
      default:
        return null;
    }
  };

  const getDefaultTitle = (type: keyof ExternalDocumentData): string => {
    const titles: Record<keyof ExternalDocumentData, string> = {
      trainerPerformance: 'Trainer Insights',
      salesInsights: 'Sales Intelligence',
      classFormatData: 'Class Format Analytics',
      clientRetentionData: 'Retention Intelligence',
      sessionsData: 'Session Optimization',
      generalInsights: 'Market Intelligence',
      monthlyAnalysis: 'Monthly Performance',
      yearlyAnalysis: 'Annual Performance',
      productPerformance: 'Product Intelligence',
      categoryPerformance: 'Category Analytics',
      salesTeamAnalysis: 'Team Performance',
      paymentAnalysis: 'Payment Insights',
      topBottomAnalysis: 'Performance Rankings'
    };
    return titles[type];
  };

  const getPositionClasses = (): string => {
    const baseClasses = 'absolute z-10';
    switch (iconPosition) {
      case 'top-right':
        return `${baseClasses} top-2 right-2`;
      case 'top-left':
        return `${baseClasses} top-2 left-2`;
      case 'bottom-right':
        return `${baseClasses} bottom-2 right-2`;
      case 'bottom-left':
        return `${baseClasses} bottom-2 left-2`;
      case 'inline':
        return 'inline-flex ml-2';
      default:
        return `${baseClasses} top-2 right-2`;
    }
  };

  if (!isKwalitySelected) {
    return <>{children}</>;
  }

  const contextualInfo = getContextualInfo();
  
  if (!contextualInfo) {
    return <>{children}</>;
  }

  if (iconPosition === 'inline') {
    return (
      <div className={`flex items-center ${className}`}>
        {children}
        <ContextualInfoIcon
          info={contextualInfo}
          size={iconSize}
          variant={iconVariant}
          onRefresh={refresh}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <ContextualInfoIcon
        info={contextualInfo}
        className={getPositionClasses()}
        size={iconSize}
        variant={iconVariant}
        onRefresh={refresh}
        loading={loading}
      />
    </div>
  );
};