import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LateCancellationsData } from '@/types/dashboard';
import { formatNumber } from '@/utils/formatters';
import { TrendingUp, TrendingDown, Award, Users, MapPin, Calendar, User, Package, Crown, Trophy, Medal, Star, ArrowDownCircle, ThumbsDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedLateCancellationsTopBottomListsProps {
  data: LateCancellationsData[];
}

export const EnhancedLateCancellationsTopBottomLists: React.FC<EnhancedLateCancellationsTopBottomListsProps> = ({ data }) => {
  const [activeType, setActiveType] = useState<'members' | 'locations' | 'classes' | 'trainers' | 'memberships'>('members');
  const [showMore, setShowMore] = useState(false);

  const getGroupedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc, item) => {
      let key = '';
      let name = '';
      
      switch (activeType) {
        case 'members':
          key = item.memberId;
          name = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown';
          break;
        case 'locations':
          key = item.location || 'Unknown';
          name = item.location || 'Unknown';
          break;
        case 'classes':
          key = item.cleanedClass || 'Unknown';
          name = item.cleanedClass || 'Unknown';
          break;
        case 'trainers':
          key = item.teacherName || 'Unknown';
          name = item.teacherName || 'Unknown';
          break;
        case 'memberships':
          key = item.cleanedProduct || 'Unknown';
          name = item.cleanedProduct || 'Unknown';
          break;
      }
      
      if (!acc[key]) {
        acc[key] = {
          name,
          totalCancellations: 0,
          uniqueMembers: new Set(),
          uniqueLocations: new Set(),
          uniqueClasses: new Set(),
          uniqueTrainers: new Set(),
        };
      }
      
      acc[key].totalCancellations += 1;
      acc[key].uniqueMembers.add(item.memberId);
      acc[key].uniqueLocations.add(item.location);
      acc[key].uniqueClasses.add(item.cleanedClass);
      acc[key].uniqueTrainers.add(item.teacherName);
      
      return acc;
    }, {} as Record<string, any>);
    
    Object.values(grouped).forEach((item: any) => {
      item.uniqueMembersCount = item.uniqueMembers.size;
      item.uniqueLocationsCount = item.uniqueLocations.size;
      item.uniqueClassesCount = item.uniqueClasses.size;
      item.uniqueTrainersCount = item.uniqueTrainers.size;
      delete item.uniqueMembers;
      delete item.uniqueLocations;
      delete item.uniqueClasses;
      delete item.uniqueTrainers;
    });
    
    return Object.values(grouped).sort((a: any, b: any) => b.totalCancellations - a.totalCancellations);
  }, [data, activeType]);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'members':
        return { icon: Users, label: 'Members', description: 'Individual member cancellation patterns' };
      case 'locations':
        return { icon: MapPin, label: 'Locations', description: 'Studio location cancellation rates' };
      case 'classes':
        return { icon: Calendar, label: 'Classes', description: 'Class type cancellation trends' };
      case 'trainers':
        return { icon: User, label: 'Trainers', description: 'Trainer-specific cancellation data' };
      case 'memberships':
        return { icon: Package, label: 'Memberships', description: 'Membership type cancellation rates' };
      default:
        return { icon: Users, label: 'Members', description: 'Cancellation data' };
    }
  };

  const renderRankingCard = () => {
    const config = getTypeConfig(activeType);
    const displayCount = showMore ? 10 : 5;
    const topItems = getGroupedData.slice(0, displayCount);
    const bottomItems = getGroupedData.slice(-displayCount).reverse();

    const getRankIcon = (index: number, isTop: boolean) => {
      if (isTop) {
        if (index === 0) return <Crown className="w-5 h-5 text-white" />;
        if (index === 1) return <Trophy className="w-5 h-5 text-white" />;
        if (index === 2) return <Medal className="w-5 h-5 text-white" />;
        if (index === 3) return <Star className="w-5 h-5 text-white" />;
        return <span className="text-white font-bold text-sm">{index + 1}</span>;
      } else {
        if (index === 0) return <ArrowDownCircle className="w-5 h-5 text-white" />;
        if (index === 1) return <TrendingDown className="w-5 h-5 text-white" />;
        if (index === 2) return <ThumbsDown className="w-5 h-5 text-white" />;
        return <AlertCircle className="w-5 h-5 text-white" />;
      }
    };

    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                {React.createElement(config.icon, { className: "w-5 h-5 text-white" })}
              </div>
              <div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {config.label} Cancellation Analysis
                </span>
                <p className="text-sm text-slate-600 font-normal mt-1">{config.description}</p>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Cancellations (Top) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                    Most Cancellations
                  </h3>
                  <p className="text-xs text-slate-500">High cancellation rate - needs attention</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {topItems.map((item, index) => (
                  <div 
                    key={item.name} 
                    className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer hover:border-red-200/70"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shrink-0">
                        {getRankIcon(index, true)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {formatNumber(item.uniqueMembersCount)} members
                          </Badge>
                          {activeType !== 'locations' && (
                            <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {formatNumber(item.uniqueLocationsCount)} locations
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <p className="text-2xl font-bold text-red-600">
                        {formatNumber(item.totalCancellations)}
                      </p>
                      <p className="text-xs text-slate-500">cancellations</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Least Cancellations (Bottom) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Least Cancellations
                  </h3>
                  <p className="text-xs text-slate-500">Low cancellation rate - performing well</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {bottomItems.map((item, index) => (
                  <div 
                    key={item.name} 
                    className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer hover:border-emerald-200/70"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shrink-0">
                        {getRankIcon(index, false)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {formatNumber(item.uniqueMembersCount)} members
                          </Badge>
                          {activeType !== 'locations' && (
                            <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {formatNumber(item.uniqueLocationsCount)} locations
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatNumber(item.totalCancellations)}
                      </p>
                      <p className="text-xs text-slate-500">cancellations</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {getGroupedData.length > 5 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMore(!showMore)}
                className="text-slate-700 hover:bg-slate-50"
              >
                {showMore ? 'Show Less' : 'Show More'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-0 shadow-xl">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-slate-600">No cancellation data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeType} onValueChange={(value) => setActiveType(value as typeof activeType)} className="w-full">
        <TabsList className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full max-w-5xl mx-auto">
          <TabsTrigger value="members" className="relative rounded-xl px-4 py-3 font-semibold text-sm w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
            <Users className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="locations" className="relative rounded-xl px-4 py-3 font-semibold text-sm w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
            <MapPin className="w-4 h-4 mr-2" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="classes" className="relative rounded-xl px-4 py-3 font-semibold text-sm w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
            <Calendar className="w-4 h-4 mr-2" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="trainers" className="relative rounded-xl px-4 py-3 font-semibold text-sm w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
            <User className="w-4 h-4 mr-2" />
            Trainers
          </TabsTrigger>
          <TabsTrigger value="memberships" className="relative rounded-xl px-4 py-3 font-semibold text-sm w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
            <Package className="w-4 h-4 mr-2" />
            Memberships
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeType} className="mt-6">
          {renderRankingCard()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
