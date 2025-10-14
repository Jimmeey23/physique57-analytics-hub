import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Users, Calendar, BarChart3, Info, Grid3x3, LayoutGrid, UserCheck, AlertCircle, Activity } from 'lucide-react';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { InfoPopover } from '@/components/ui/InfoPopover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HeroSection } from '@/components/ui/HeroSection';

type GroupByOption = 'product' | 'category' | 'teacher' | 'location' | 'memberStatus';

export const PatternsAndTrends = () => {
  const { data: checkinsData, loading, error } = useCheckinsData();
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupByOption>('product');
  
  // Filter states
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedMemberStatus, setSelectedMemberStatus] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const products = new Set<string>();
    const categories = new Set<string>();
    const teachers = new Set<string>();
    const memberStatuses = new Set<string>();
    const months = new Set<string>();

    checkinsData.forEach(item => {
      if (item.cleanedProduct) products.add(item.cleanedProduct);
      if (item.cleanedCategory) categories.add(item.cleanedCategory);
      if (item.teacherName) teachers.add(item.teacherName);
      if (item.isNew) memberStatuses.add(item.isNew);
      if (item.month) months.add(item.month);
    });

    return {
      products: Array.from(products).sort(),
      categories: Array.from(categories).sort(),
      teachers: Array.from(teachers).sort(),
      memberStatuses: Array.from(memberStatuses).sort(),
      months: Array.from(months).sort()
    };
  }, [checkinsData]);

  // Filter data by location and additional filters
  const filteredData = useMemo(() => {
    let data = checkinsData;
    
    // Location filter
    if (selectedLocation !== 'All Locations') {
      data = data.filter(item => {
        const location = item.location || '';
        if (selectedLocation === 'Kenkere House') {
          return location.toLowerCase().includes('kenkere') || location === 'Kenkere House';
        }
        return location === selectedLocation;
      });
    }

    // Product filter
    if (selectedProducts.length > 0) {
      data = data.filter(item => selectedProducts.includes(item.cleanedProduct || ''));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      data = data.filter(item => selectedCategories.includes(item.cleanedCategory || ''));
    }

    // Teacher filter
    if (selectedTeachers.length > 0) {
      data = data.filter(item => selectedTeachers.includes(item.teacherName || ''));
    }

    // Member status filter
    if (selectedMemberStatus.length > 0) {
      data = data.filter(item => selectedMemberStatus.includes(item.isNew || ''));
    }

    // Month filter
    if (selectedMonths.length > 0) {
      data = data.filter(item => selectedMonths.includes(item.month || ''));
    }

    return data;
  }, [checkinsData, selectedLocation, selectedProducts, selectedCategories, selectedTeachers, selectedMemberStatus, selectedMonths]);

  // Process data: month-on-month breakdown by product/category/teacher
  const monthlyProductData = useMemo(() => {
    const grouped: Record<string, Record<string, { visits: number; uniqueMembers: Set<string> }>> = {};
    const monthsSet = new Set<string>();

    filteredData.forEach(item => {
      if (!item.checkedIn) return; // Only count actual check-ins
      
      // Determine grouping key based on selected option
      let groupKey = '';
      if (groupBy === 'product') {
        groupKey = item.cleanedProduct || 'Unknown';
      } else if (groupBy === 'category') {
        groupKey = item.cleanedCategory || 'Unknown';
      } else if (groupBy === 'teacher') {
        groupKey = item.teacherName || 'Unknown';
      } else if (groupBy === 'location') {
        groupKey = item.location || 'Unknown';
      } else if (groupBy === 'memberStatus') {
        groupKey = item.isNew || 'Unknown';
      }
      
      const monthYear = `${item.month} ${item.year}`;
      
      if (!grouped[groupKey]) grouped[groupKey] = {};
      if (!grouped[groupKey][monthYear]) {
        grouped[groupKey][monthYear] = {
          visits: 0,
          uniqueMembers: new Set()
        };
      }
      
      grouped[groupKey][monthYear].visits += 1;
      grouped[groupKey][monthYear].uniqueMembers.add(item.memberId);
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

    // Calculate totals row
    const totalsRow = {
      product: 'TOTAL',
      monthlyBreakdown: months.map(month => {
        const monthVisits = products.reduce((sum, p) => {
          const monthData = p.monthlyBreakdown.find(m => m.month === month);
          return sum + (monthData?.visits || 0);
        }, 0);
        
        const monthUniqueMembers = new Set<string>();
        filteredData.forEach(item => {
          if (item.checkedIn && `${item.month} ${item.year}` === month) {
            monthUniqueMembers.add(item.memberId);
          }
        });
        
        return {
          month,
          visits: monthVisits,
          uniqueMembers: monthUniqueMembers.size
        };
      }),
      totalVisits: products.reduce((sum, p) => sum + p.totalVisits, 0),
      totalUniqueMembers: new Set(filteredData.filter(d => d.checkedIn).map(d => d.memberId)).size
    };

    return { products, months, totalsRow };
  }, [filteredData, groupBy]);

  const toggleProductExpansion = (product: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(product)) {
      newExpanded.delete(product);
    } else {
      newExpanded.add(product);
    }
    setExpandedRows(newExpanded);
  };

  // Calculate visit frequency buckets (monthly check-ins per member)
  const visitFrequencyData = useMemo(() => {
    const memberMonthlyVisits: Record<string, Record<string, number>> = {};
    
    filteredData.forEach(item => {
      if (!item.checkedIn) return;
      const monthYear = `${item.month} ${item.year}`;
      
      if (!memberMonthlyVisits[item.memberId]) {
        memberMonthlyVisits[item.memberId] = {};
      }
      memberMonthlyVisits[item.memberId][monthYear] = (memberMonthlyVisits[item.memberId][monthYear] || 0) + 1;
    });

    const buckets = {
      '1 class': 0,
      '2-5 classes': 0,
      '6-10 classes': 0,
      '11-15 classes': 0,
      '16-20 classes': 0,
      '21-25 classes': 0,
      '>25 classes': 0
    };

    Object.values(memberMonthlyVisits).forEach(monthData => {
      Object.values(monthData).forEach(count => {
        if (count === 1) buckets['1 class']++;
        else if (count >= 2 && count <= 5) buckets['2-5 classes']++;
        else if (count >= 6 && count <= 10) buckets['6-10 classes']++;
        else if (count >= 11 && count <= 15) buckets['11-15 classes']++;
        else if (count >= 16 && count <= 20) buckets['16-20 classes']++;
        else if (count >= 21 && count <= 25) buckets['21-25 classes']++;
        else if (count > 25) buckets['>25 classes']++;
      });
    });

    return buckets;
  }, [filteredData]);

  // Calculate late cancellation frequency buckets
  const lateCancellationFrequencyData = useMemo(() => {
    const memberMonthlyLateCancels: Record<string, Record<string, number>> = {};
    
    filteredData.forEach(item => {
      if (!item.isLateCancelled) return;
      const monthYear = `${item.month} ${item.year}`;
      
      if (!memberMonthlyLateCancels[item.memberId]) {
        memberMonthlyLateCancels[item.memberId] = {};
      }
      memberMonthlyLateCancels[item.memberId][monthYear] = (memberMonthlyLateCancels[item.memberId][monthYear] || 0) + 1;
    });

    const buckets = {
      '1 cancellation': 0,
      '2-5 cancellations': 0,
      '6-10 cancellations': 0,
      '11-15 cancellations': 0,
      '16-20 cancellations': 0,
      '21-25 cancellations': 0,
      '>25 cancellations': 0
    };

    Object.values(memberMonthlyLateCancels).forEach(monthData => {
      Object.values(monthData).forEach(count => {
        if (count === 1) buckets['1 cancellation']++;
        else if (count >= 2 && count <= 5) buckets['2-5 cancellations']++;
        else if (count >= 6 && count <= 10) buckets['6-10 cancellations']++;
        else if (count >= 11 && count <= 15) buckets['11-15 cancellations']++;
        else if (count >= 16 && count <= 20) buckets['16-20 cancellations']++;
        else if (count >= 21 && count <= 25) buckets['21-25 cancellations']++;
        else if (count > 25) buckets['>25 cancellations']++;
      });
    });

    return buckets;
  }, [filteredData]);

  // Calculate multiple classes per day
  const multipleClassesPerDay = useMemo(() => {
    const dailyCheckins: Record<string, Record<string, number>> = {};
    
    filteredData.forEach(item => {
      if (!item.checkedIn) return;
      const date = item.dateIST || '';
      
      if (!dailyCheckins[item.memberId]) {
        dailyCheckins[item.memberId] = {};
      }
      dailyCheckins[item.memberId][date] = (dailyCheckins[item.memberId][date] || 0) + 1;
    });

    let membersWithMultipleClasses = 0;
    let totalMultipleClassDays = 0;

    Object.values(dailyCheckins).forEach(memberDates => {
      const daysWithMultiple = Object.values(memberDates).filter(count => count > 1).length;
      if (daysWithMultiple > 0) {
        membersWithMultipleClasses++;
        totalMultipleClassDays += daysWithMultiple;
      }
    });

    return {
      membersWithMultipleClasses,
      totalMultipleClassDays,
      avgMultipleClassDays: membersWithMultipleClasses > 0 ? (totalMultipleClassDays / membersWithMultipleClasses).toFixed(1) : '0'
    };
  }, [filteredData]);

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <HeroSection
          title="Patterns & Trends"
          subtitle="Member Visit Analytics"
          description="Month-on-month breakdown of visits by product and membership type"
          badgeText="Visit Patterns"
          badgeIcon={BarChart3}
          gradient="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
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
        <HeroSection
          title="Patterns & Trends"
          subtitle="Member Visit Analytics"
          description="Month-on-month breakdown of visits by product and membership type"
          badgeText="Visit Patterns"
          badgeIcon={BarChart3}
          gradient="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
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
      <HeroSection
        title="Patterns & Trends"
        subtitle="Member Visit Analytics"
        description="Month-on-month breakdown of visits by product and membership type"
        badgeText="Visit Patterns"
        badgeIcon={BarChart3}
        gradient="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
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
              <div className="flex items-center gap-2">
                {(selectedProducts.length + selectedCategories.length + selectedTeachers.length + selectedMemberStatus.length + selectedMonths.length) > 0 && (
                  <Badge variant="default" className="bg-indigo-600 text-white">
                    {selectedProducts.length + selectedCategories.length + selectedTeachers.length + selectedMemberStatus.length + selectedMonths.length} active
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {isFiltersCollapsed ? 'Click to expand' : 'Click to collapse'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          {!isFiltersCollapsed && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Products Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Products
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.products.map(product => (
                        <label key={product} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product]);
                              } else {
                                setSelectedProducts(selectedProducts.filter(p => p !== product));
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700">{product}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedProducts.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProducts([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Categories Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Categories
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.categories.map(category => (
                        <label key={category} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                              }
                            }}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedCategories.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Teachers Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-600" />
                    Teachers
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.teachers.map(teacher => (
                        <label key={teacher} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTeachers.includes(teacher)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeachers([...selectedTeachers, teacher]);
                              } else {
                                setSelectedTeachers(selectedTeachers.filter(t => t !== teacher));
                              }
                            }}
                            className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                          />
                          <span className="text-sm text-slate-700">{teacher}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedTeachers.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTeachers([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Member Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Member Status
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.memberStatuses.map(status => (
                        <label key={status} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMemberStatus.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMemberStatus([...selectedMemberStatus, status]);
                              } else {
                                setSelectedMemberStatus(selectedMemberStatus.filter(s => s !== status));
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedMemberStatus.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMemberStatus([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Months Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Months
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.months.map(month => (
                        <label key={month} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMonths.includes(month)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMonths([...selectedMonths, month]);
                              } else {
                                setSelectedMonths(selectedMonths.filter(m => m !== month));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">{month}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedMonths.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMonths([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>

              {/* Clear All Filters */}
              {(selectedProducts.length + selectedCategories.length + selectedTeachers.length + selectedMemberStatus.length + selectedMonths.length) > 0 && (
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedProducts([]);
                      setSelectedCategories([]);
                      setSelectedTeachers([]);
                      setSelectedMemberStatus([]);
                      setSelectedMonths([]);
                    }}
                    className="text-slate-700 hover:bg-slate-100"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Grouping Options */}
        <Card className="glass-card modern-card-hover rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-indigo-600" />
              Group Data By
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={groupBy === 'product' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('product');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'product' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Product
              </Button>
              <Button
                variant={groupBy === 'category' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('category');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'category' ? 'bg-purple-600 hover:bg-purple-700' : ''
                )}
              >
                <Grid3x3 className="w-4 h-4" />
                Category
              </Button>
              <Button
                variant={groupBy === 'teacher' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('teacher');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'teacher' ? 'bg-pink-600 hover:bg-pink-700' : ''
                )}
              >
                <Users className="w-4 h-4" />
                Teacher
              </Button>
              <Button
                variant={groupBy === 'location' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('location');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'location' ? 'bg-blue-600 hover:bg-blue-700' : ''
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                Location
              </Button>
              <Button
                variant={groupBy === 'memberStatus' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('memberStatus');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'memberStatus' ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                )}
              >
                <UserCheck className="w-4 h-4" />
                Member Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Month-on-Month Product Breakdown Table */}
        <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-indigo-800 to-purple-900 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Member Visits by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} - Month on Month
              </CardTitle>
              <Badge className="bg-white/20 text-white border-white/30">
                {monthlyProductData.products.length} {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}s
              </Badge>
            </div>
            <p className="text-indigo-100 text-sm mt-2">
              Track member check-in patterns across {groupBy}s and time periods
            </p>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900">
                  <TableRow className="border-none">
                    <TableHead className="font-bold text-white sticky left-0 bg-indigo-900/95 backdrop-blur-sm z-30 min-w-[240px]">
                      {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
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
                    const isExpanded = expandedRows.has(productData.product);
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
                              <div className="space-y-6">
                                {/* Summary Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <p className="text-slate-600 text-xs font-medium">Peak Month</p>
                                    <p className="font-bold text-pink-600 text-lg">
                                      {productData.monthlyBreakdown.reduce((max, m) => m.visits > max.visits ? m : max, productData.monthlyBreakdown[0])?.month.split(' ')[0] || '-'}
                                    </p>
                                  </div>
                                </div>

                                {/* Month-by-Month Breakdown Table */}
                                <div className="bg-white rounded-lg border overflow-hidden">
                                  <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-2 border-b">
                                    <h4 className="font-semibold text-slate-700 text-sm">Monthly Breakdown</h4>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="font-semibold">Month</TableHead>
                                          <TableHead className="text-center font-semibold">Visits</TableHead>
                                          <TableHead className="text-center font-semibold">Unique Members</TableHead>
                                          <TableHead className="text-center font-semibold">Avg Visits/Member</TableHead>
                                          <TableHead className="text-center font-semibold">vs Prev Month</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {productData.monthlyBreakdown.map((month, idx) => {
                                          const prevMonth = idx < productData.monthlyBreakdown.length - 1 ? productData.monthlyBreakdown[idx + 1] : null;
                                          const growth = prevMonth ? getChangePercentage(month.visits, prevMonth.visits) : 0;
                                          
                                          return (
                                            <TableRow key={month.month} className="hover:bg-slate-50">
                                              <TableCell className="font-medium">{month.month}</TableCell>
                                              <TableCell className="text-center">{formatNumber(month.visits)}</TableCell>
                                              <TableCell className="text-center">{formatNumber(month.uniqueMembers)}</TableCell>
                                              <TableCell className="text-center">
                                                {month.uniqueMembers > 0 ? (month.visits / month.uniqueMembers).toFixed(1) : '0'}
                                              </TableCell>
                                              <TableCell className="text-center">
                                                {prevMonth && (
                                                  <div className={cn(
                                                    "flex items-center justify-center gap-1",
                                                    growth > 0 ? "text-green-600" : growth < 0 ? "text-red-600" : "text-slate-500"
                                                  )}>
                                                    {growth > 0 ? <TrendingUp className="w-3 h-3" /> : growth < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                                                    <span className="text-xs font-medium">{growth > 0 ? '+' : ''}{growth.toFixed(1)}%</span>
                                                  </div>
                                                )}
                                                {!prevMonth && <span className="text-xs text-slate-400">-</span>}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Totals Row */}
                  <TableRow className="bg-gradient-to-r from-emerald-50 to-green-50 border-t-2 border-emerald-600 font-bold">
                    <TableCell className="sticky left-0 bg-gradient-to-r from-emerald-100 to-green-100 z-10 border-r">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6" /> {/* Spacer for alignment */}
                        <span className="text-emerald-800 font-bold text-sm">TOTAL (All {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}s)</span>
                      </div>
                    </TableCell>
                    {monthlyProductData.totalsRow.monthlyBreakdown.map((monthData) => (
                      <TableCell key={monthData.month} className="text-center font-bold text-emerald-800">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="cursor-help">{formatNumber(monthData.visits)}</TooltipTrigger>
                            <TooltipContent>
                              {monthData.month} • {monthData.uniqueMembers} unique members total
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold text-emerald-800 text-base">
                      {formatNumber(monthlyProductData.totalsRow.totalVisits)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-emerald-800 text-base">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4" />
                        {formatNumber(monthlyProductData.totalsRow.totalUniqueMembers)}
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Visit Frequency Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Visit Frequency */}
          <Card className="bg-gradient-to-br from-white via-blue-50/30 to-white border-0 shadow-xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-t-lg">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Monthly Visit Frequency
              </CardTitle>
              <p className="text-blue-100 text-xs mt-1">
                Distribution of members by classes attended per month
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {Object.entries(visitFrequencyData).map(([bucket, count]) => (
                  <div key={bucket} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <span className="font-medium text-slate-700">{bucket}</span>
                    <Badge className="bg-blue-600 text-white font-bold">
                      {formatNumber(count)} member-months
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Late Cancellation Frequency */}
          <Card className="bg-gradient-to-br from-white via-red-50/30 to-white border-0 shadow-xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-red-800 to-pink-900 text-white rounded-t-lg">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Late Cancellation Frequency
              </CardTitle>
              <p className="text-red-100 text-xs mt-1">
                Distribution of members by late cancellations per month
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {Object.entries(lateCancellationFrequencyData).map(([bucket, count]) => (
                  <div key={bucket} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                    <span className="font-medium text-slate-700">{bucket}</span>
                    <Badge className="bg-red-600 text-white font-bold">
                      {formatNumber(count)} member-months
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Multiple Classes Per Day */}
        <Card className="bg-gradient-to-br from-white via-purple-50/30 to-white border-0 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-purple-800 to-indigo-900 text-white rounded-t-lg">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Multiple Classes Per Day Analysis
            </CardTitle>
            <p className="text-purple-100 text-xs mt-1">
              Members attending more than one class on the same day
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                <p className="text-slate-600 text-sm font-medium mb-2">Members with Multiple Classes/Day</p>
                <p className="font-bold text-purple-800 text-3xl">
                  {formatNumber(multipleClassesPerDay.membersWithMultipleClasses)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
                <p className="text-slate-600 text-sm font-medium mb-2">Total Days with Multiple Classes</p>
                <p className="font-bold text-indigo-800 text-3xl">
                  {formatNumber(multipleClassesPerDay.totalMultipleClassDays)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                <p className="text-slate-600 text-sm font-medium mb-2">Avg Multiple Class Days/Member</p>
                <p className="font-bold text-blue-800 text-3xl">
                  {multipleClassesPerDay.avgMultipleClassDays}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatternsAndTrends;

