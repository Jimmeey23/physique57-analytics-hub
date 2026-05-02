import { useMemo } from 'react';
import { CheckinData } from './useCheckinsData';
import { ExpirationData, SalesData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';

export interface ChurnRiskMember {
  memberId: string;
  memberName: string;
  email: string;
  lastVisitDate: string | null;
  daysSinceVisit: number | null;
  expiryDate: string | null;
  daysToExpiry: number | null;
  totalVisits: number;
  totalRevenue: number;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export const useChurnRiskScore = (
  checkins: CheckinData[],
  expirations: ExpirationData[],
  sales: SalesData[]
) => {
  return useMemo(() => {
    const members: Record<string, Partial<ChurnRiskMember>> = {};

    // 1. Process Checkins for visit info
    checkins.forEach(c => {
      if (!c.memberId) return;
      
      if (!members[c.memberId]) {
        members[c.memberId] = {
          memberId: c.memberId,
          memberName: `${c.firstName} ${c.lastName}`.trim(),
          email: c.email,
          totalVisits: 0,
          lastVisitDate: null,
          totalRevenue: 0
        };
      }
      
      if (c.checkedIn) {
        members[c.memberId].totalVisits! += 1;
        const visitDate = c.dateIST;
        if (!members[c.memberId].lastVisitDate || (visitDate && visitDate > members[c.memberId].lastVisitDate!)) {
          members[c.memberId].lastVisitDate = visitDate;
        }
      }
    });

    // 2. Process Sales for revenue
    sales.forEach(s => {
      if (!s.memberId || !members[s.memberId]) return;
      members[s.memberId].totalRevenue! += (s.paymentValue || 0);
    });

    // 3. Process Expirations for expiry info
    expirations.forEach(e => {
      if (!e.memberId || !members[e.memberId]) return;
      const expiryDate = e.endDate;
      if (!members[e.memberId].expiryDate || (expiryDate && expiryDate > members[e.memberId].expiryDate!)) {
        members[e.memberId].expiryDate = expiryDate;
      }
    });

    const now = new Date();
    
    const results: ChurnRiskMember[] = Object.values(members).map(m => {
      let riskScore = 0;
      
      // Last visit logic
      let daysSinceVisit: number | null = null;
      if (m.lastVisitDate) {
        const lastVisit = parseDate(m.lastVisitDate);
        if (lastVisit) {
          daysSinceVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceVisit > 60) riskScore += 20;
          else if (daysSinceVisit > 30) riskScore += 30;
        }
      } else {
        riskScore += 30; // No visit record
      }

      // Expiry logic
      let daysToExpiry: number | null = null;
      if (m.expiryDate) {
        const expiry = parseDate(m.expiryDate);
        if (expiry) {
          daysToExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysToExpiry < 30 && daysToExpiry >= 0) riskScore += 40;
          else if (daysToExpiry < 60 && daysToExpiry >= 0) riskScore += 20;
          else if (daysToExpiry < 0) riskScore += 50; // Already expired
        }
      }

      // Total visits logic
      if ((m.totalVisits || 0) < 3) riskScore += 10;

      riskScore = Math.min(100, riskScore);

      let riskLevel: ChurnRiskMember['riskLevel'] = 'low';
      if (riskScore >= 75) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 25) riskLevel = 'medium';

      return {
        ...m,
        daysSinceVisit,
        daysToExpiry,
        riskScore,
        riskLevel
      } as ChurnRiskMember;
    });

    return results.sort((a, b) => b.riskScore - a.riskScore);
  }, [checkins, expirations, sales]);
};
