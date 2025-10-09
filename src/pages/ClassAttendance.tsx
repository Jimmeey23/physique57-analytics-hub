import React, { useMemo } from 'react';
import { UpdatedEnhancedClassAttendanceSection } from '@/components/dashboard/UpdatedEnhancedClassAttendanceSection';
import { Footer } from '@/components/ui/footer';
import { SessionsFiltersProvider } from '@/contexts/SessionsFiltersContext';
import { ModernHeroSection } from '@/components/ui/ModernHeroSection';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useFilteredSessionsData } from '@/hooks/useFilteredSessionsData';
import { formatNumber, formatCurrency } from '@/utils/formatters';

const ClassAttendanceContent = () => {
  const { data } = useSessionsData();
  const filteredData = useFilteredSessionsData(data || []);

  const heroMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    // Calculate comprehensive metrics based on filtered data
    const totalSessions = filteredData.length;
    const totalAttendance = filteredData.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const totalCapacity = filteredData.reduce((sum, session) => sum + (session.capacity || 0), 0);
    const totalRevenue = filteredData.reduce((sum, session) => sum + (session.totalPaid || 0), 0);
    
    const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    const classAverage = totalSessions > 0 ? totalAttendance / totalSessions : 0;
    
    // Get unique locations for location-specific metrics
    const uniqueLocations = [...new Set(filteredData.map(item => item.location))].filter(Boolean);
    const uniqueClasses = [...new Set(filteredData.map(item => item.cleanedClass))].filter(Boolean);
    const uniqueTrainers = [...new Set(filteredData.map(item => item.trainerName))].filter(Boolean);

    return [
      {
        location: 'Sessions',
        label: 'Total Sessions',
        value: formatNumber(totalSessions),
        subValue: `${uniqueClasses.length} classes`
      },
      {
        location: 'Attendance', 
        label: 'Total Attendance',
        value: formatNumber(totalAttendance),
        subValue: `${formatNumber(classAverage)} avg/class`
      },
      {
        location: 'Revenue',
        label: 'Earned Revenue', 
        value: formatCurrency(totalRevenue),
        subValue: `${formatCurrency(totalRevenue / totalSessions)} avg/session`
      },
      {
        location: 'Coverage',
        label: 'Locations & Trainers',
        value: `${uniqueLocations.length} locations`,
        subValue: `${uniqueTrainers.length} trainers`
      }
    ];
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      <ModernHeroSection 
        title="Class Attendance Analytics"
        subtitle="Comprehensive class utilization and attendance trend analysis across all sessions"
        variant="attendance"
        metrics={heroMetrics}
        onExport={() => console.log('Exporting attendance data...')}
      />

      <div className="container mx-auto px-6 py-8">
        <UpdatedEnhancedClassAttendanceSection />
      </div>
      
      <Footer />
    </div>
  );
};

const ClassAttendance = () => {
  return (
    <SessionsFiltersProvider>
      <ClassAttendanceContent />
    </SessionsFiltersProvider>
  );
};

export default ClassAttendance;