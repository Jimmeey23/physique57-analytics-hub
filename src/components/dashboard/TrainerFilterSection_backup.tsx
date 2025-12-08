
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, User, X, Filter, Search, DollarSign, Target, Activity } from 'lucide-react';
import { PayrollData } from '@/types/dashboard';

interface TrainerFilterSectionProps {
  data: PayrollData[];
  onFiltersChange: (filters: any) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface EnhancedFilters {
  location: string;
  trainer: string;
  month: string;
  searchTerm: string;
  minSessions: string;
  maxSessions: string;
  minRevenue: string;
  maxRevenue: string;
  performanceLevel: string;
  classType: string;
}

export const TrainerFilterSection: React.FC<TrainerFilterSectionProps> = ({
  data,
  onFiltersChange,
  isCollapsed,
  onToggleCollapse
}) => {
  const [filters, setFilters] = useState<EnhancedFilters>({
    location: '',
    trainer: '',
    month: '',
    searchTerm: '',
    minSessions: '',
    maxSessions: '',
    minRevenue: '',
    maxRevenue: '',
    performanceLevel: '',
    classType: ''
  });

  // Extract unique values from data
  const locations = Array.from(new Set(data.map(item => item.location))).filter(Boolean).sort();
  const trainers = Array.from(new Set(data.map(item => item.teacherName))).filter(Boolean).sort();
  const months = Array.from(new Set(data.map(item => item.monthYear))).filter(Boolean).sort().reverse();
  
  // Performance levels
  const performanceLevels = [
    { value: '', label: 'All Performance Levels' },
    { value: 'high', label: 'High Performers (Top 25%)' },
    { value: 'medium', label: 'Medium Performers (25-75%)' },
    { value: 'low', label: 'Low Performers (Bottom 25%)' }
  ];

  // Class types (basic categorization)
  const classTypes = [
    { value: '', label: 'All Class Types' },
    { value: 'cycle', label: 'Cycle Classes' },
    { value: 'barre', label: 'Barre Classes' },
    { value: 'strength', label: 'Strength Classes' }
  ];

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<EnhancedFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Convert to format expected by parent
    const parentFilters = {
      location: updatedFilters.location || '',
      trainer: updatedFilters.trainer || '',
      month: updatedFilters.month || '',
      searchTerm: updatedFilters.searchTerm || '',
      minSessions: updatedFilters.minSessions ? parseInt(updatedFilters.minSessions) : null,
      maxSessions: updatedFilters.maxSessions ? parseInt(updatedFilters.maxSessions) : null,
      minRevenue: updatedFilters.minRevenue ? parseFloat(updatedFilters.minRevenue) : null,
      maxRevenue: updatedFilters.maxRevenue ? parseFloat(updatedFilters.maxRevenue) : null,
      performanceLevel: updatedFilters.performanceLevel || '',
      classType: updatedFilters.classType || ''
    };
    
    onFiltersChange(parentFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const emptyFilters: EnhancedFilters = {
      location: '',
      trainer: '',
      month: '',
      searchTerm: '',
      minSessions: '',
      maxSessions: '',
      minRevenue: '',
      maxRevenue: '',
      performanceLevel: '',
      classType: ''
    };
    updateFilters(emptyFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');
  const activeFilterCount = Object.values(filters).filter(value => value !== '').length;

  if (isCollapsed) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Advanced Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="text-blue-600 hover:text-blue-700"
              >
                Show Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Advanced Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-slate-600 hover:text-slate-700"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-blue-600 hover:text-blue-700"
            >
              Hide Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Primary Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Location
            </Label>
            <Select
              value={filters.location}
              onValueChange={(value) => updateFilters({ location: value })}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trainer Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <User className="w-3 h-3" />
              Trainer
            </Label>
            <Select
              value={filters.trainer}
              onValueChange={(value) => updateFilters({ trainer: value })}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="All Trainers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Trainers</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer} value={trainer}>
                    {trainer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Month
            </Label>
            <Select
              value={filters.month}
              onValueChange={(value) => updateFilters({ month: value })}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search and Performance Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Search className="w-3 h-3" />
              Search
            </Label>
            <Input
              placeholder="Search trainers..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="bg-white border-slate-200"
            />
          </div>

          {/* Performance Level Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Performance Level
            </Label>
            <Select
              value={filters.performanceLevel}
              onValueChange={(value) => updateFilters({ performanceLevel: value })}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="All Performance Levels" />
              </SelectTrigger>
              <SelectContent>
                {performanceLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Type Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Class Type Focus
            </Label>
            <Select
              value={filters.classType}
              onValueChange={(value) => updateFilters({ classType: value })}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="All Class Types" />
              </SelectTrigger>
              <SelectContent>
                {classTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Range Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sessions Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Sessions Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minSessions}
                onChange={(e) => updateFilters({ minSessions: e.target.value })}
                className="bg-white border-slate-200"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxSessions}
                onChange={(e) => updateFilters({ maxSessions: e.target.value })}
                className="bg-white border-slate-200"
              />
            </div>
          </div>

          {/* Revenue Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Revenue Range ($)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minRevenue}
                onChange={(e) => updateFilters({ minRevenue: e.target.value })}
                className="bg-white border-slate-200"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxRevenue}
                onChange={(e) => updateFilters({ maxRevenue: e.target.value })}
                className="bg-white border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Active Filters:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                const labels: Record<string, string> = {
                  location: 'Location',
                  trainer: 'Trainer',
                  month: 'Month',
                  searchTerm: 'Search',
                  minSessions: 'Min Sessions',
                  maxSessions: 'Max Sessions',
                  minRevenue: 'Min Revenue',
                  maxRevenue: 'Max Revenue',
                  performanceLevel: 'Performance',
                  classType: 'Class Type'
                };
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 border-blue-300"
                  >
                    {labels[key]}: {value}
                    <button
                      onClick={() => updateFilters({ [key]: '' } as Partial<EnhancedFilters>)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
