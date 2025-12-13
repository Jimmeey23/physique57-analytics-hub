import React, { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Users, Activity, Target, BarChart3, Calendar, AlertCircle, CheckCircle, Lightbulb, Download, FileText } from 'lucide-react';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { useLocationReportData } from '@/hooks/useLocationReportData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { Button } from '@/components/ui/button';
import { generateLocationReportPDF } from '@/services/htmlPDFService';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

interface LocationReportComprehensiveProps {
  onReady?: () => void;
}

const locations = [
  { id: 'all', name: 'All Locations', fullName: 'All Studio Locations' },
  { id: 'kwality', name: 'Kwality House, Kemps Corner', fullName: 'Kwality House, Kemps Corner' },
  { id: 'supreme', name: 'Supreme HQ, Bandra', fullName: 'Supreme HQ, Bandra' },
  { id: 'kenkere', name: 'Kenkere House, Bengaluru', fullName: 'Kenkere House, Bengaluru' }
];

export const LocationReportComprehensive: React.FC<LocationReportComprehensiveProps> = ({ onReady }) => {
  const { filters: globalFilters, updateFilters, clearFilters } = useGlobalFilters();
  const [activeLocation, setActiveLocation] = useState('kwality');
  const [isReady, setIsReady] = useState(false);
  const { data: reportData, metrics, isLoading } = useLocationReportData();
  const { setLoading } = useGlobalLoading();

  const markReady = useCallback(() => setIsReady(true), []);

  // Debug logging
  React.useEffect(() => {
    console.log('LocationReportComprehensive Debug:', {
      isLoading,
      hasMetrics: !!metrics,
      hasReportData: !!reportData,
      metrics,
      globalFilters
    });
  }, [isLoading, metrics, reportData, globalFilters]);

  React.useEffect(() => {
    if (isReady) {
      onReady?.();
    }
  }, [isReady, onReady]);

  const handleLocationChange = useCallback((locationId: string) => {
    setActiveLocation(locationId);
    const location = locations.find(loc => loc.id === locationId);
    if (location && locationId !== 'all') {
      updateFilters({ location: [location.fullName] });
    } else {
      updateFilters({ location: [] });
    }
  }, [updateFilters]);

  const handleFiltersChange = useCallback((newFilters: any) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleFilterReset = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const handlePDFExport = useCallback(async () => {
    if (!reportData) return;
    try {
      setLoading(true, 'Generating PDF report...');
      await generateLocationReportPDF(reportData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  }, [reportData, setLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <BrandSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading location performance data...</span>
      </div>
    );
  }

  // Show metrics even if they're all zeros - let the component handle display
  // Only block if metrics is truly null/undefined
  if (metrics === null || metrics === undefined) {
    if (!isLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-2">No data available for location reports</p>
            <p className="text-sm text-gray-500">Try adjusting the date range or check your data sources</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
  }

  const currentLocation = locations.find(loc => loc.id === activeLocation) || locations[0];

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <AutoCloseFilterSection 
        filters={globalFilters}
        onFiltersChange={handleFiltersChange}
        onReset={handleFilterReset}
      />

      {/* Location Tabs */}
      <Tabs value={activeLocation} onValueChange={handleLocationChange} className="w-full">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full gap-2 mb-8">
          {locations.map((location) => (
            <TabsTrigger 
              key={location.id} 
              value={location.id}
              className="relative flex items-center justify-center gap-2 px-4 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:via-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border border-slate-200 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1"
            >
              <Building2 className="w-4 h-4" />
              <span className="whitespace-nowrap">{location.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All Locations Tab */}
        <TabsContent value="all" className="space-y-8 mt-8">
          <LocationReportContent 
            location={locations[0]} 
            metrics={metrics}
            isAllLocations={true}
            reportData={reportData}
            onReady={markReady}
            onExport={handlePDFExport}
          />
        </TabsContent>

        {/* Individual Location Tabs */}
        {locations.slice(1).map((location) => (
          <TabsContent key={location.id} value={location.id} className="space-y-8 mt-8">
            <LocationReportContent 
              location={location} 
              metrics={metrics}
              isAllLocations={false}
              reportData={reportData}
              onReady={markReady}
              onExport={handlePDFExport}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface LocationReportContentProps {
  location: typeof locations[0];
  metrics: any;
  isAllLocations: boolean;
  reportData: any;
  onReady: () => void;
  onExport: () => void;
}

const LocationReportContent: React.FC<LocationReportContentProps> = ({
  location,
  metrics,
  isAllLocations,
  reportData,
  onReady,
  onExport
}) => {
  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available for {location.name}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{location.fullName}</h1>
          <p className="text-gray-600 mt-2">Comprehensive Performance Report</p>
        </div>
        <Button
          onClick={onExport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Executive Summary with Written Narrative */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {generateExecutiveSummary(metrics, location.name, isAllLocations)}
            </p>
          </div>
          
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalRevenue || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Net: {formatCurrency(metrics.netRevenue || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Sessions Conducted</p>
              <p className="text-2xl font-bold text-green-600">{formatNumber(metrics.totalSessions || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Fill Rate: {formatPercentage(metrics.fillRate || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-600">New Clients</p>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(metrics.newClientsAcquired || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">LTV: {formatCurrency(metrics.averageLTV || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Retention Rate</p>
              <p className="text-2xl font-bold text-orange-600">{formatPercentage(metrics.retentionRate || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Churn: {formatPercentage(metrics.churnRate || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Performance Deep Dive */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Revenue Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {generateRevenueNarrative(metrics, location.name)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Breakdown */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Gross Revenue</span>
                  <span className="font-bold text-green-700">{formatCurrency(metrics.totalRevenue || 0)}</span>
                </div>
                <div className="border-t border-gray-300"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Discounts</span>
                  <span className="font-bold text-red-600">-{formatCurrency(metrics.totalDiscounts || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">VAT</span>
                  <span className="font-bold text-gray-600">-{formatCurrency(metrics.vatAmount || 0)}</span>
                </div>
                <div className="border-t border-gray-300"></div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Net Revenue</span>
                  <span className="font-bold text-blue-700 text-lg">{formatCurrency(metrics.netRevenue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Transaction Metrics */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Transaction Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Total Transactions</span>
                  <span className="font-bold text-blue-700">{formatNumber(metrics.totalTransactions || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Unique Members</span>
                  <span className="font-bold text-blue-700">{formatNumber(metrics.uniqueMembers || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Avg Transaction</span>
                  <span className="font-bold text-blue-700">{formatCurrency(metrics.avgTransactionValue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Avg/Member</span>
                  <span className="font-bold text-blue-700">{formatCurrency(metrics.avgSpendPerMember || 0)}</span>
                </div>
              </div>
            </div>

            {/* Discount Analysis */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Discount Impact</h3>
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-700">Discount Rate</p>
                  <p className="text-3xl font-bold text-orange-600">{formatPercentage(metrics.discountRate || 0)}</p>
                </div>
                <div className="text-center py-3 bg-white/50 rounded">
                  <p className="text-sm text-gray-700">Total Discounts</p>
                  <p className="text-xl font-bold text-orange-700">{formatCurrency(metrics.totalDiscounts || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Performance Deep Dive */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Session & Class Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {generateSessionNarrative(metrics, location.name)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Overview */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Session Overview</h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">Total Sessions</p>
                  <p className="text-3xl font-bold text-purple-600">{formatNumber(metrics.totalSessions || 0)}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">Total Check-ins</p>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(metrics.totalCheckIns || 0)}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">Fill Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{formatPercentage(metrics.fillRate || 0)}</p>
                </div>
              </div>
            </div>

            {/* Class Format Distribution */}
            <div className="bg-gradient-to-br from-pink-50 to-red-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Class Format Mix</h3>
              <div className="space-y-3">
                {[
                  { name: 'PowerCycle', count: metrics.powerCycleSessions || 0, color: 'bg-red-500' },
                  { name: 'Barre', count: metrics.barreSessions || 0, color: 'bg-pink-500' },
                  { name: 'Strength', count: metrics.strengthSessions || 0, color: 'bg-blue-500' }
                ].map((format) => {
                  const percentage = metrics.totalSessions > 0 ? (format.count / (metrics.totalSessions || 1)) * 100 : 0;
                  return (
                    <div key={format.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{format.name}</span>
                        <span className="text-sm font-bold text-gray-900">{formatNumber(format.count)} ({formatPercentage(percentage)})</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`${format.color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Late Cancellations */}
          {(metrics.lateCancellations || 0) > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Late Cancellations Impact</h4>
                  <p className="text-sm text-red-700 mt-1">
                    <strong>{formatNumber(metrics.lateCancellations)}</strong> late cancellations resulted in <strong>{formatCurrency(metrics.lateCancellationRevenueLoss || 0)}</strong> revenue loss. This represents a significant operational challenge that needs attention.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trainer Performance */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Trainer Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {generateTrainerNarrative(metrics, location.name)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trainer Metrics */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Trainer Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Total Trainers</p>
                  <p className="text-2xl font-bold text-orange-600">{formatNumber(metrics.totalTrainers || 0)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Sessions/Trainer</p>
                  <p className="text-2xl font-bold text-orange-600">{formatNumber(metrics.sessionsPerTrainer || 0)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Avg Class Size</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(metrics.avgClassSize || 0)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Revenue/Trainer</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.revenuePerTrainer || 0)}</p>
                </div>
              </div>
            </div>

            {/* Top Performer */}
            {metrics.topTrainerName && (
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-6 rounded-lg border-2 border-yellow-300">
                <h3 className="font-semibold text-gray-900 mb-4">🏆 Top Performer</h3>
                <div className="bg-white p-6 rounded-lg text-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{metrics.topTrainerName}</h4>
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(metrics.topTrainerRevenue || 0)}</p>
                  <p className="text-sm text-gray-600 mt-2">Revenue Generated This Period</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Analytics */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Client Analytics & Retention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {generateClientNarrative(metrics, location.name)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Acquisition */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Acquisition</h3>
              <div className="space-y-3">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">New Clients</p>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(metrics.newClientsAcquired || 0)}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-600">{formatPercentage(metrics.conversionRate || 0)}</p>
                </div>
              </div>
            </div>

            {/* Retention */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Retention</h3>
              <div className="space-y-3">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Retention Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{formatPercentage(metrics.retentionRate || 0)}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Churn Rate</p>
                  <p className="text-3xl font-bold text-red-600">{formatPercentage(metrics.churnRate || 0)}</p>
                </div>
              </div>
            </div>

            {/* Lifetime Value */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Lifetime Value</h3>
              <div className="space-y-3">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Average LTV</p>
                  <p className="text-3xl font-bold text-yellow-600">{formatCurrency(metrics.averageLTV || 0)}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Days to Convert</p>
                  <p className="text-3xl font-bold text-orange-600">{formatNumber(metrics.avgConversionDays || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Funnel */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            Lead Funnel Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {generateLeadNarrative(metrics, location.name)}
            </p>
          </div>

          <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 p-6 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Leads', value: metrics.totalLeads || 0, color: 'text-teal-600' },
                { label: 'Trial Clients', value: metrics.trialClients || 0, color: 'text-cyan-600' },
                { label: 'Converted', value: metrics.leadsConverted || 0, color: 'text-green-600' },
                { label: 'Conversion %', value: formatPercentage(metrics.leadConversionRate || 0), color: 'text-blue-600', isPercentage: true }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>
                    {item.isPercentage ? item.value : formatNumber(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights and Recommendations */}
      {reportData?.insights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {reportData.insights.highlights && reportData.insights.highlights.length > 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Key Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {reportData.insights.highlights.slice(0, 4).map((highlight, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {reportData.insights.concerns && reportData.insights.concerns.length > 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="w-5 h-5" />
                  Areas of Concern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {reportData.insights.concerns.slice(0, 4).map((concern, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {reportData.insights.recommendations && reportData.insights.recommendations.length > 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Lightbulb className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {reportData.insights.recommendations.slice(0, 4).map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// Narrative Generation Functions
function generateExecutiveSummary(metrics: any, locationName: string, isAllLocations: boolean): string {
  const performanceLevel = (metrics.retentionRate || 0) > 80 ? 'excellent' : (metrics.retentionRate || 0) > 60 ? 'good' : 'needs attention';
  return `${locationName} demonstrated ${performanceLevel} performance this period, with total revenue of ${formatCurrency(metrics.totalRevenue || 0)} generated across ${formatNumber(metrics.totalSessions || 0)} sessions. The location maintained a ${formatPercentage(metrics.fillRate || 0)} fill rate with ${formatNumber(metrics.newClientsAcquired || 0)} new client acquisitions and a ${formatPercentage(metrics.retentionRate || 0)} client retention rate. This comprehensive report provides detailed insights into revenue performance, session utilization, trainer productivity, and client acquisition metrics.`;
}

function generateRevenueNarrative(metrics: any, locationName: string): string {
  const discountImpact = ((metrics.totalDiscounts || 0) / (metrics.totalRevenue || 1)) * 100;
  return `Revenue performance at ${locationName} shows ${formatCurrency(metrics.totalRevenue || 0)} in gross revenue from ${formatNumber(metrics.totalTransactions || 0)} transactions across ${formatNumber(metrics.uniqueMembers || 0)} unique members. The average transaction value of ${formatCurrency(metrics.avgTransactionValue || 0)} reflects a mix of membership packages and individual sessions. Discount penetration at ${formatPercentage(discountImpact)} suggests ${discountImpact > 15 ? 'aggressive promotional activity' : 'moderate promotional strategy'}, resulting in ${formatCurrency(metrics.netRevenue || 0)} net revenue after accounting for discounts and VAT.`;
}

function generateSessionNarrative(metrics: any, locationName: string): string {
  return `With ${formatNumber(metrics.totalSessions || 0)} sessions conducted this period, ${locationName} achieved a ${formatPercentage(metrics.fillRate || 0)} class fill rate, translating to ${formatNumber(metrics.totalCheckIns || 0)} total check-ins. The class format distribution shows a balanced mix with PowerCycle representing ${metrics.totalSessions > 0 ? ((metrics.powerCycleSessions || 0) / (metrics.totalSessions || 1) * 100).toFixed(1) : 0}% of sessions. Average class size of ${formatNumber(metrics.avgClassSize || 0)} participants demonstrates healthy demand across session times.`;
}

function generateTrainerNarrative(metrics: any, locationName: string): string {
  return `${locationName} operates with ${formatNumber(metrics.totalTrainers || 0)} trainers, averaging ${formatNumber(metrics.sessionsPerTrainer || 0)} sessions per trainer and generating ${formatCurrency(metrics.revenuePerTrainer || 0)} revenue per trainer. The top performer, ${metrics.topTrainerName || 'a star trainer'}, generated ${formatCurrency(metrics.topTrainerRevenue || 0)} in revenue this period, indicating strong individual performance and potential for team motivation and recognition.`;
}

function generateClientNarrative(metrics: any, locationName: string): string {
  return `Client metrics at ${locationName} show strong acquisition of ${formatNumber(metrics.newClientsAcquired || 0)} new members with an average lifetime value of ${formatCurrency(metrics.averageLTV || 0)}. The ${formatPercentage(metrics.retentionRate || 0)} retention rate indicates effective member engagement and service quality. With ${formatPercentage(metrics.conversionRate || 0)} trial-to-paid conversion, the location demonstrates solid ability to convert prospects into paying members, with an average conversion timeline of ${formatNumber(metrics.avgConversionDays || 0)} days.`;
}

function generateLeadNarrative(metrics: any, locationName: string): string {
  return `The lead funnel at ${locationName} processed ${formatNumber(metrics.totalLeads || 0)} total leads, converting ${formatNumber(metrics.leadsConverted || 0)} into paying clients (${formatPercentage(metrics.leadConversionRate || 0)} conversion rate). With ${formatNumber(metrics.trialClients || 0)} trial participants, the location maintains a healthy pipeline for future membership growth and demonstrates effective lead qualification and trial-to-paid conversion processes.`;
}

export default LocationReportComprehensive;
