import React, { useMemo } from 'react';
import { UpdatedEnhancedClassAttendanceSection } from '@/components/dashboard/UpdatedEnhancedClassAttendanceSection';
import { Footer } from '@/components/ui/footer';
import { SessionsFiltersProvider } from '@/contexts/SessionsFiltersContext';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useFilteredSessionsData } from '@/hooks/useFilteredSessionsData';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { AiNotes } from '@/components/ui/AiNotes';

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
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-purple-50/30 to-pink-50/20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-white/40 backdrop-blur-[0.5px]"></div>
      <div className="relative z-10">
      <DashboardMotionHero 
        title="Class Attendance Analytics"
        subtitle="Comprehensive class utilization and attendance trend analysis across all sessions"
        metrics={heroMetrics}
        onExportClick={() => console.log('Exporting attendance data...')}
      />

      <div className="container mx-auto px-6 py-8">
        <UpdatedEnhancedClassAttendanceSection />
        
        <div className="mt-8">
          <AiNotes 
            location="class-attendance"
            sectionId="analytics" 
            tableKey="class-attendance-main"
            author="Class Attendance Analyst"
          />
        </div>
      </div>
      
      <Footer />
      </div>
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