import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Users, Calendar, BarChart3, Info } from 'lucide-react';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { InfoPopover } from '@/components/ui/InfoPopover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HeroHeader } from '@/components/ui/HeroHeader';

export const PatternsAndTrends = () => {
  const { data: checkinsData, loading, error } = useCheckinsData();
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Filter data by location
  const filteredData = useMemo(() => {
    if (selectedLocation === 'All Locations') return checkinsData;
    
    return checkinsData.filter(item => {
      const location = item.location || '';
      if (selectedLocation === 'Kenkere House') {
        return location.toLowerCase().includes('kenkere') || location === 'Kenkere House';
      }
      return location === selectedLocation;
    });
  }, [checkinsData, selectedLocation]);

  // Process data: month-on-month breakdown by product
  const monthlyProductData = useMemo(() => {
    const grouped: Record<string, Record<string, { visits: number; uniqueMembers: Set<string> }>> = {};
    const monthsSet = new Set<string>();

    filteredData.forEach(item => {
      if (!item.checkedIn) return; // Only count actual check-ins
      
      const product = item.cleanedProduct || 'Unknown';
      const monthYear = `${item.month} ${item.year}`;
      
      if (!grouped[product]) grouped[product] = {};
      if (!grouped[product][monthYear]) {
        grouped[product][monthYear] = {
          visits: 0,
          uniqueMembers: new Set()
        };
      }
      
      grouped[product][monthYear].visits += 1;
      grouped[product][monthYear].uniqueMembers.add(item.memberId);
      monthsSet.add(monthYear);
    });

    // Sort months chronologically
    const months = Array.from(monthsSet).sort((a, b) => {
      const parseMonth = (str: string) => {
        const [month, year] = str.split(' ');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return new Date(parseInt(year), monthNames.indexOf(month), 1);
      };
      return parseMonth(b).getTime() - parseMonth(a).getTime();
    });

    // Convert to array and calculate totals
    const products = Object.entries(grouped).map(([product, monthData]) => {
      const monthlyBreakdown = months.map(month => ({
        month,
        visits: monthData[month]?.visits || 0,
        uniqueMembers: monthData[month]?.uniqueMembers.size || 0
      }));

      const totalVisits = monthlyBreakdown.reduce((sum, m) => sum + m.visits, 0);
      const allUniqueMembers = new Set<string>();
      Object.values(monthData).forEach(d => {
        d.uniqueMembers.forEach(id => allUniqueMembers.add(id));
      });

      return {
        product,
        monthlyBreakdown,
        totalVisits,
        totalUniqueMembers: allUniqueMembers.size
      };
    }).sort((a, b) => b.totalVisits - a.totalVisits);

    return { products, months };
  }, [filteredData]);

  const toggleProductExpansion = (product: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(product)) {
      newExpanded.delete(product);
    } else {
      newExpanded.add(product);
    }
    setExpandedProducts(newExpanded);
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <HeroHeader
          title="Patterns & Trends"
          subtitle="Member visit patterns and product usage trends over time"
          gradient="from-indigo-600 via-purple-600 to-pink-600"
          icon={<BarChart3 className="w-12 h-12" />}
        />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <BrandSpinner size="sm" />
                <span className="text-slate-600">Loading patterns and trends data...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <HeroHeader
          title="Patterns & Trends"
          subtitle="Member visit patterns and product usage trends over time"
          gradient="from-indigo-600 via-purple-600 to-pink-600"
          icon={<BarChart3 className="w-12 h-12" />}
        />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-xl">
            <CardContent className="p-6">
              <p className="text-red-700">Error loading data: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <HeroHeader
        title="Patterns & Trends"
        subtitle="Member visit patterns and product usage trends over time"
        gradient="from-indigo-600 via-purple-600 to-pink-600"
        icon={<BarChart3 className="w-12 h-12" />}
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Location Tabs */}
        <div className="flex justify-center items-start mb-8" id="location-tabs">
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-4 location-tabs">
              {[
                { id: 'All Locations', name: 'All Locations', sub: `(${formatNumber(filteredData.filter(d => d.checkedIn).length)} visits)` },
                { id: 'Kwality House, Kemps Corner', name: 'Kwality House', sub: `Kemps Corner (${formatNumber(checkinsData.filter(d => d.checkedIn && d.location === 'Kwality House, Kemps Corner').length)})` },
                { id: 'Supreme HQ, Bandra', name: 'Supreme HQ', sub: `Bandra (${formatNumber(checkinsData.filter(d => d.checkedIn && d.location === 'Supreme HQ, Bandra').length)})` },
                { id: 'Kenkere House', name: 'Kenkere House', sub: `Bengaluru (${formatNumber(checkinsData.filter(d => d.checkedIn && d.location.includes('Kenkere')).length)})` },
              ].map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`location-tab-trigger group ${selectedLocation === loc.id ? 'data-[state=active]:[--tab-accent:var(--hero-accent)]' : ''}`}
                  data-state={selectedLocation === loc.id ? 'active' : 'inactive'}
                >
                  <span className="relative z-10 flex flex-col items-center leading-tight">
                    <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">{loc.name}</span>
                    <span className="text-xs sm:text-sm opacity-90">{loc.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="ml-3 mt-1">
            <InfoPopover context="sales-overview" locationId={selectedLocation === 'All Locations' ? 'all' : selectedLocation.toLowerCase().includes('kwality') ? 'kwality' : selectedLocation.toLowerCase().includes('supreme') ? 'supreme' : 'kenkere'} />
          </div>
        </div>

        {/* Filter Section */}
        <Card className="glass-card modern-card-hover rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}>
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                {isFiltersCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Filters & Options
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {isFiltersCollapsed ? 'Click to expand' : 'Click to collapse'}
              </Badge>
            </div>
          </CardHeader>
          {!isFiltersCollapsed && (
            <CardContent>
              <p className="text-sm text-slate-600">
                Additional filters coming soon. Currently showing data for {selectedLocation}.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Month-on-Month Product Breakdown Table */}
        <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-indigo-800 to-purple-900 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Member Visits by Product - Month on Month
              </CardTitle>
              <Badge className="bg-white/20 text-white border-white/30">
                {monthlyProductData.products.length} Products
              </Badge>
            </div>
            <p className="text-indigo-100 text-sm mt-2">
              Track member check-in patterns across products and time periods
            </p>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900">
                  <TableRow className="border-none">
                    <TableHead className="font-bold text-white sticky left-0 bg-indigo-900/95 backdrop-blur-sm z-30 min-w-[240px]">
                      Product / Membership
                    </TableHead>
                    {monthlyProductData.months.map((month) => (
                      <TableHead key={month} className="text-center font-bold text-white min-w-[140px]">
                        <div className="flex flex-col">
                          <span className="text-sm">{month.split(' ')[0]}</span>
                          <span className="text-slate-200 text-xs">{month.split(' ')[1]}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold text-white min-w-[120px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">Total Visits</TooltipTrigger>
                          <TooltipContent>Sum of all check-ins across all months</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center font-bold text-white min-w-[120px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">Unique Members</TooltipTrigger>
                          <TooltipContent>Total unique members who checked in</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyProductData.products.map((productData) => {
                    const isExpanded = expandedProducts.has(productData.product);
                    const values = productData.monthlyBreakdown.map(m => m.visits);
                    const growth = values.length >= 2 ? getChangePercentage(values[0], values[1]) : 0;

                    return (
                      <React.Fragment key={productData.product}>
                        <TableRow className="hover:bg-slate-50/50 transition-colors border-b">
                          <TableCell className="font-medium text-slate-800 sticky left-0 bg-white z-10 border-r">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleProductExpansion(productData.product)}
                                className="p-1 h-6 w-6"
                              >
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </Button>
                              <span className="text-sm">{productData.product}</span>
                            </div>
                          </TableCell>
                          {productData.monthlyBreakdown.map((monthData, index) => (
                            <TableCell key={monthData.month} className="text-center text-sm font-medium text-slate-800">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">{formatNumber(monthData.visits)}</TooltipTrigger>
                                  <TooltipContent>
                                    {monthData.month} • {monthData.uniqueMembers} unique members
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-bold text-slate-700">
                            {formatNumber(productData.totalVisits)}
                          </TableCell>
                          <TableCell className="text-center font-bold text-blue-600">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="w-3 h-3" />
                              {formatNumber(productData.totalUniqueMembers)}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Row Details */}
                        {isExpanded && (
                          <TableRow className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 animate-fade-in">
                            <TableCell colSpan={monthlyProductData.months.length + 3} className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                  <p className="text-slate-600 text-xs font-medium">Total Check-ins</p>
                                  <p className="font-bold text-slate-800 text-2xl">{formatNumber(productData.totalVisits)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                  <p className="text-slate-600 text-xs font-medium">Unique Members</p>
                                  <p className="font-bold text-indigo-600 text-2xl">{formatNumber(productData.totalUniqueMembers)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                  <p className="text-slate-600 text-xs font-medium">Avg Visits/Member</p>
                                  <p className="font-bold text-purple-600 text-2xl">
                                    {productData.totalUniqueMembers > 0 ? (productData.totalVisits / productData.totalUniqueMembers).toFixed(1) : '0'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatternsAndTrends;
