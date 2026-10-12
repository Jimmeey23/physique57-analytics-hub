import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EnhancedClassAttendanceMetricCards } from './EnhancedClassAttendanceMetricCards';
import { SessionsFiltersProvider } from '@/contexts/SessionsFiltersContext';
import type { SessionData } from '@/hooks/useSessionsData';

describe('attendance metric cards', () => {
  it('renders populated cards when booking and no-show comparisons are unavailable', () => {
    const session = {
      date: '2026-09-01', time: '09:00', dayOfWeek: 'Tuesday',
      trainerName: 'Instructor', cleanedClass: 'Barre', location: 'Kwality House',
      capacity: 10, checkedInCount: 6, bookedCount: 8, lateCancelledCount: 1,
      totalPaid: 1200,
    } as SessionData;
    const html = renderToStaticMarkup(
      <SessionsFiltersProvider>
        <EnhancedClassAttendanceMetricCards data={[session]} />
      </SessionsFiltersProvider>,
    );
    expect(html).toContain('Booking Rate');
    expect(html).toContain('No-Show Rate');
    expect(html).toContain('80%');
    expect(html).toContain('12.5%');
    expect(html.match(/Year-over-year comparison unavailable/g)).toHaveLength(2);
  });
});
