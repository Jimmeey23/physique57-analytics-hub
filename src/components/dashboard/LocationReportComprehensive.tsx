import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp, Users, Activity, Target, Download, FileText, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { useLocationReportData } from '@/hooks/useLocationReportData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { Button } from '@/components/ui/button';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

interface LocationReportComprehensiveProps {
  onReady?: () => void;
}

const locations = [
  { id: 'all', name: 'All Locations', fullName: 'All Studio Locations' },
  { id: 'kwality', name: 'Kwality House', fullName: 'Kwality House, Kemps Corner' },
  { id: 'supreme', name: 'Supreme HQ', fullName: 'Supreme HQ, Bandra' },
  { id: 'kenkere', name: 'Kenkere House', fullName: 'Kenkere House, Bengaluru' }
];

export const LocationReportComprehensive: React.FC<LocationReportComprehensiveProps> = ({ onReady }) => {
  const { filters: globalFilters, updateFilters, clearFilters } = useGlobalFilters();
  const [activeLocation, setActiveLocation] = useState('all');
  const { data: reportData, metrics, isLoading } = useLocationReportData();
  const { setLoading } = useGlobalLoading();

  React.useEffect(() => {
    if (!isLoading && onReady) {
      onReady();
    }
  }, [isLoading, onReady]);

  const handleLocationChange = useCallback((locationId: string) => {
    setActiveLocation(locationId);
  }, []);

  const handleFiltersChange = useCallback((newFilters: any) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleFilterReset = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <BrandSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading location performance data...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-2">No data available for location reports</p>
          <p className="text-sm text-gray-500">Try adjusting the date range or check your data sources</p>
        </div>
      </div>
    );
  }

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
              className="relative flex items-center justify-center gap-2 px-4 py-3"
            >
              <Building2 className="w-4 h-4" />
              <span className="whitespace-nowrap">{location.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Report Content for Each Location */}
        {locations.map((location) => (
          <TabsContent key={location.id} value={location.id} className="space-y-8 mt-8">
            <LocationReportContent 
              location={location} 
              metrics={metrics}
              isAllLocations={location.id === 'all'}
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
}

const LocationReportContent: React.FC<LocationReportContentProps> = ({
  location,
  metrics,
  isAllLocations
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{location.fullName}</h1>
            <p className="text-gray-600 mt-2 text-lg">Executive Performance Report • Last 3 Months (Debug Mode)</p>
          </div>
          <div className="text-right">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">Performance Score</span>
              <div className="text-3xl font-bold">{metrics.overallScore || 0}/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Hero */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Executive Performance Dashboard</h2>
            <p className="text-blue-200">Quick Performance Overview • Last 3 Months (Debug Mode)</p>
          </div>
          
          {/* Quick Stats Pills */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{formatCurrency(metrics.totalRevenue || 0, true)}</div>
              <div className="text-xs text-blue-200">Revenue</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{formatNumber(metrics.totalSessions || 0)}</div>
              <div className="text-xs text-blue-200">Sessions</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{formatPercentage(metrics.fillRate || 0)}</div>
              <div className="text-xs text-blue-200">Fill Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{formatNumber(metrics.newClientsAcquired || 0)}</div>
              <div className="text-xs text-blue-200">New Clients</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{formatPercentage(metrics.retentionRate || 0)}</div>
              <div className="text-xs text-blue-200">Retention</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{formatPercentage(metrics.leadConversionRate || 0)}</div>
              <div className="text-xs text-blue-200">Conversion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive KPI Grid */}
      <div className="space-y-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Key Performance Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revenue & Growth Row */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-emerald-500 pl-3">Revenue & Growth</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-lg border border-emerald-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.totalRevenue || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Gross earnings</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.netRevenue || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">After VAT</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenue/Member</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.avgSpendPerMember || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Per member value</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Discount Rate</p>
                      <p className="text-2xl font-bold text-orange-600">{formatPercentage(metrics.discountRate || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatCurrency(metrics.totalDiscounts || 0)} total</p>
                    </div>
                    <Target className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Operations & Efficiency Row */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-blue-500 pl-3">Operations & Efficiency</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                      <p className="text-2xl font-bold text-purple-600">{formatNumber(metrics.totalSessions || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatNumber(metrics.totalCheckIns || 0)} check-ins</p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fill Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{formatPercentage(metrics.fillRate || 0)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (metrics.fillRate || 0) >= 85 ? 'bg-green-100 text-green-800' :
                          (metrics.fillRate || 0) >= 70 ? 'bg-blue-100 text-blue-800' :
                          (metrics.fillRate || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(metrics.fillRate || 0) >= 85 ? 'Excellent' :
                           (metrics.fillRate || 0) >= 70 ? 'Good' :
                           (metrics.fillRate || 0) >= 50 ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                    </div>
                    <Activity className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Late Cancellations</p>
                      <p className="text-2xl font-bold text-red-600">{formatNumber(metrics.lateCancellations || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatCurrency(metrics.lateCancellationRevenueLoss || 0)} loss</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Class Size</p>
                      <p className="text-2xl font-bold text-green-600">{formatNumber(metrics.avgClassSize || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Participants/session</p>
                    </div>
                    <Users className="w-8 h-8 text-green-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Growth & Retention Row */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-purple-500 pl-3">Client Growth & Retention</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Clients</p>
                      <p className="text-2xl font-bold text-green-600">{formatNumber(metrics.newClientsAcquired || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Acquired this period</p>
                    </div>
                    <Users className="w-8 h-8 text-green-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                      <p className="text-2xl font-bold text-purple-600">{formatPercentage(metrics.retentionRate || 0)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (metrics.retentionRate || 0) >= 85 ? 'bg-green-100 text-green-800' :
                          (metrics.retentionRate || 0) >= 75 ? 'bg-blue-100 text-blue-800' :
                          (metrics.retentionRate || 0) >= 65 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(metrics.retentionRate || 0) >= 85 ? 'Excellent' :
                           (metrics.retentionRate || 0) >= 75 ? 'Good' :
                           (metrics.retentionRate || 0) >= 65 ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Lead Conversion</p>
                      <p className="text-2xl font-bold text-teal-600">{formatPercentage(metrics.leadConversionRate || 0)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (metrics.leadConversionRate || 0) >= 25 ? 'bg-green-100 text-green-800' :
                          (metrics.leadConversionRate || 0) >= 20 ? 'bg-blue-100 text-blue-800' :
                          (metrics.leadConversionRate || 0) >= 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(metrics.leadConversionRate || 0) >= 25 ? 'Excellent' :
                           (metrics.leadConversionRate || 0) >= 20 ? 'Good' :
                           (metrics.leadConversionRate || 0) >= 15 ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                    </div>
                    <Target className="w-8 h-8 text-teal-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                      <p className="text-2xl font-bold text-red-600">{formatPercentage(metrics.churnRate || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatNumber(metrics.churnedMembers || 0)} members lost</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-200" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Class Format & Trainer Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class Format Breakdown */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Class Format Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'PowerCycle', count: metrics.powerCycleSessions || 0, color: 'bg-purple-500' },
                  { name: 'Barre', count: metrics.barreSessions || 0, color: 'bg-pink-500' },
                  { name: 'Strength', count: metrics.strengthSessions || 0, color: 'bg-orange-500' }
                ].map((format, idx) => {
                  const total = (metrics.powerCycleSessions || 0) + (metrics.barreSessions || 0) + (metrics.strengthSessions || 0);
                  const percentage = total > 0 ? (format.count / total) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{format.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">{formatNumber(format.count)}</span>
                          <span className="text-xs text-gray-500 ml-1">({formatPercentage(percentage)})</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${format.color} h-3 rounded-full transition-all duration-500`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Top Trainer Spotlight */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Users className="w-5 h-5" />
                🏆 Top Performer Spotlight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="bg-white p-6 rounded-xl border-2 border-yellow-200 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{metrics.topTrainerName || 'N/A'}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-3xl font-bold text-orange-600">{formatCurrency(metrics.topTrainerRevenue || 0)}</p>
                      <p className="text-sm text-gray-600">Revenue Generated</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-purple-600">{formatNumber(Math.round((metrics.topTrainerRevenue || 0) / (metrics.avgSpendPerMember || 1)))}</p>
                      <p className="text-sm text-gray-600">Sessions Led</p>
                    </div>
                  </div>
                  <div className="mt-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium inline-block">
                    Top Revenue Contributor
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Performance */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Revenue Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Gross Revenue</span>
                  <span className="font-bold text-green-700">{formatCurrency(metrics.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Transactions</span>
                  <span className="font-bold">{formatNumber(metrics.totalTransactions || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Avg Transaction</span>
                  <span className="font-bold">{formatCurrency(metrics.avgTransactionValue || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Member Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Unique Members</span>
                  <span className="font-bold text-blue-700">{formatNumber(metrics.uniqueMembers || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Avg Spend/Member</span>
                  <span className="font-bold">{formatCurrency(metrics.avgSpendPerMember || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Discounts</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Total Discounts</span>
                  <span className="font-bold text-red-600">{formatCurrency(metrics.totalDiscounts || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Discount Rate</span>
                  <span className="font-bold">{formatPercentage(metrics.discountRate || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Performance */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Session Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Session Overview</h3>
              <div className="space-y-3">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">Total Sessions</p>
                  <p className="text-3xl font-bold text-purple-600">{formatNumber(metrics.totalSessions || 0)}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">Fill Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{formatPercentage(metrics.fillRate || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-red-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Class Formats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">PowerCycle</span>
                  <span className="font-bold">{formatNumber(metrics.powerCycleSessions || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Barre</span>
                  <span className="font-bold">{formatNumber(metrics.barreSessions || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Strength</span>
                  <span className="font-bold">{formatNumber(metrics.strengthSessions || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Late Cancellations</h3>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-700">Total</p>
                <p className="text-3xl font-bold text-red-600">{formatNumber(metrics.lateCancellations || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Loss: {formatCurrency(metrics.lateCancellationRevenueLoss || 0)}</p>
              </div>
            </div>
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-6 rounded-lg border-2 border-yellow-300">
              <h3 className="font-semibold text-gray-900 mb-4">🏆 Top Performer</h3>
              <div className="bg-white p-6 rounded-lg text-center">
                <h4 className="text-xl font-bold text-gray-900 mb-2">{metrics.topTrainerName || 'N/A'}</h4>
                <p className="text-3xl font-bold text-orange-600">{formatCurrency(metrics.topTrainerRevenue || 0)}</p>
                <p className="text-sm text-gray-600 mt-2">Revenue Generated</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Analytics */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Client Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Acquisition</h3>
              <div className="space-y-3">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">New Clients</p>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(metrics.newClientsAcquired || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Retention</h3>
              <div className="space-y-3">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Retention Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{formatPercentage(metrics.retentionRate || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Lifetime Value</h3>
              <div className="space-y-3">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Average LTV</p>
                  <p className="text-3xl font-bold text-yellow-600">{formatCurrency(metrics.averageLTV || 0)}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">Total Leads</p>
              <p className="text-3xl font-bold text-teal-600">{formatNumber(metrics.totalLeads || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">Converted</p>
              <p className="text-3xl font-bold text-green-600">{formatNumber(metrics.leadsConverted || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
              <p className="text-3xl font-bold text-blue-600">{formatPercentage(metrics.leadConversionRate || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Key Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                (metrics.totalRevenue || 0) > 50000 ? `Strong revenue performance: ${formatCurrency(metrics.totalRevenue)}` : null,
                (metrics.fillRate || 0) >= 75 ? `Excellent class utilization: ${formatPercentage(metrics.fillRate)} fill rate` : null,
                (metrics.retentionRate || 0) >= 80 ? `High client retention: ${formatPercentage(metrics.retentionRate)}` : null,
                (metrics.newClientsAcquired || 0) >= 20 ? `Strong client acquisition: ${formatNumber(metrics.newClientsAcquired)} new members` : null,
                (metrics.leadConversionRate || 0) >= 20 ? `Effective lead conversion: ${formatPercentage(metrics.leadConversionRate)}` : null,
                metrics.topTrainerName !== 'N/A' ? `${metrics.topTrainerName} leading performance with ${formatCurrency(metrics.topTrainerRevenue)} revenue` : null
              ].filter(Boolean).slice(0, 4).map((achievement, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{achievement}</span>
                </li>
              ))}
              {[
                (metrics.totalRevenue || 0) > 50000 ? `Strong revenue performance: ${formatCurrency(metrics.totalRevenue)}` : null,
                (metrics.fillRate || 0) >= 75 ? `Excellent class utilization: ${formatPercentage(metrics.fillRate)} fill rate` : null,
                (metrics.retentionRate || 0) >= 80 ? `High client retention: ${formatPercentage(metrics.retentionRate)}` : null,
                (metrics.newClientsAcquired || 0) >= 20 ? `Strong client acquisition: ${formatNumber(metrics.newClientsAcquired)} new members` : null,
                (metrics.leadConversionRate || 0) >= 20 ? `Effective lead conversion: ${formatPercentage(metrics.leadConversionRate)}` : null,
                metrics.topTrainerName !== 'N/A' ? `${metrics.topTrainerName} leading performance` : null
              ].filter(Boolean).length === 0 ? (
                <li className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Location operational with consistent service delivery</span>
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-5 h-5" />
              Areas Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                (metrics.fillRate || 0) < 60 ? `Low class utilization: ${formatPercentage(metrics.fillRate)} fill rate (Target: 70%+)` : null,
                (metrics.churnRate || 0) > 20 ? `High churn rate: ${formatPercentage(metrics.churnRate)} member loss` : null,
                (metrics.retentionRate || 0) < 70 ? `Retention below target: ${formatPercentage(metrics.retentionRate)} (Target: 75%+)` : null,
                (metrics.leadConversionRate || 0) < 15 ? `Low lead conversion: ${formatPercentage(metrics.leadConversionRate)} (Target: 20%+)` : null,
                (metrics.lateCancellations || 0) > 50 ? `High late cancellations: ${formatNumber(metrics.lateCancellations)} affecting revenue` : null,
                (metrics.discountRate || 0) > 15 ? `Heavy discount usage: ${formatPercentage(metrics.discountRate)} impacting margins` : null
              ].filter(Boolean).slice(0, 4).map((concern, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{concern}</span>
                </li>
              ))}
              {[
                (metrics.fillRate || 0) < 60 ? `Low class utilization` : null,
                (metrics.churnRate || 0) > 20 ? `High churn rate` : null,
                (metrics.retentionRate || 0) < 70 ? `Retention below target` : null,
                (metrics.leadConversionRate || 0) < 15 ? `Low lead conversion` : null,
                (metrics.lateCancellations || 0) > 50 ? `High late cancellations` : null,
                (metrics.discountRate || 0) > 15 ? `Heavy discount usage` : null
              ].filter(Boolean).length === 0 ? (
                <li className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>All key metrics performing within acceptable ranges</span>
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Lightbulb className="w-5 h-5" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                (metrics.fillRate || 0) < 70 ? 'Optimize class schedules and capacity management' : null,
                (metrics.churnRate || 0) > 15 ? 'Implement enhanced member retention programs' : null,
                (metrics.discountRate || 0) > 12 ? 'Review pricing strategy to reduce discount dependency' : null,
                (metrics.leadConversionRate || 0) < 18 ? 'Improve lead nurturing and trial conversion process' : null,
                (metrics.lateCancellations || 0) > 30 ? 'Strengthen cancellation policy enforcement' : null,
                (metrics.powerCycleSessions || 0) > (metrics.totalSessions || 1) * 0.7 ? 'Consider diversifying class format offerings' : null,
                (metrics.avgClassSize || 0) < 8 ? 'Focus marketing on increasing class attendance' : null,
                (metrics.newClientsAcquired || 0) < 15 ? 'Enhance member referral and acquisition programs' : null
              ].filter(Boolean).slice(0, 4).map((recommendation, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{recommendation}</span>
                </li>
              ))}
              {[
                (metrics.fillRate || 0) < 70 ? 'Optimize class schedules' : null,
                (metrics.churnRate || 0) > 15 ? 'Enhance retention programs' : null,
                (metrics.discountRate || 0) > 12 ? 'Review pricing strategy' : null,
                (metrics.leadConversionRate || 0) < 18 ? 'Improve lead conversion' : null
              ].filter(Boolean).length === 0 ? (
                <li className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Continue current strategies while monitoring market trends</span>
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocationReportComprehensive;
