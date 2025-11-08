import { useMemo } from 'react';
import { SalesData, NewClientData } from '@/types/dashboard';
import { CheckinData } from './useCheckinsData';

export interface DailyAnalytics {
  date: string;
  revenue: number;
  newClientRevenue: number;
  existingClientRevenue: number;
  activeMembershipRevenue: number;
  transactions: number;
  newClients: number;
  existingClients: number;
  renewals: number;
  upgrades: number;
  downgrades: number;
  stacking: number;
}

export interface MembershipAnalytics {
  membershipName: string;
  cleanedCategory: string;
  revenue: number;
  count: number;
  avgPrice: number;
  newClients: number;
  existingClients: number;
  renewals: number;
  upgrades: number;
  downgrades: number;
}

export interface SpenderData {
  memberId: string;
  customerName: string;
  customerEmail: string;
  totalSpent: number;
  transactions: number;
  avgTransaction: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  isNew: boolean;
}

export interface LapsedMemberData {
  memberId: string;
  customerName: string;
  customerEmail: string;
  lastMembershipEndDate: string;
  daysSinceLapsed: number;
  lastMembershipType: string;
  totalLifetimeValue: number;
  lastPurchaseAmount: number;
}

export interface OutlierMonthAnalytics {
  // Overall metrics
  totalRevenue: number;
  newClientRevenue: number;
  existingClientRevenue: number;
  activeMembershipRevenue: number;
  
  // Client counts
  totalClients: number;
  newClients: number;
  existingClients: number;
  clientsWithActiveMembers: number;
  clientsWithMultipleMemberships: number;
  
  // Membership behavior
  renewals: number;
  upgrades: number;
  downgrades: number;
  stackingMembers: number;
  
  // Daily breakdown
  dailyAnalytics: DailyAnalytics[];
  
  // Membership breakdown
  membershipAnalytics: MembershipAnalytics[];
  
  // Spenders
  topSpenders: SpenderData[];
  bottomSpenders: SpenderData[];
  
  // Lapsed members
  lapsedMembers: LapsedMemberData[];
  
  // Discount analytics
  totalDiscountGiven: number;
  transactionsWithDiscount: number;
  avgDiscountPercentage: number;
  
  // Visit patterns (from checkins)
  totalVisits: number;
  avgVisitsPerClient: number;
  visitToRevenueRatio: number;
}

export const useOutlierMonthAnalytics = (
  salesData: SalesData[],
  checkinsData: CheckinData[],
  newClientData: NewClientData[],
  month: 'april' | 'august',
  location?: string
) => {
  return useMemo(() => {
    // Determine month parameters
    const monthConfig = month === 'april' 
      ? { year: 2025, monthIndex: 3, monthName: 'April' }
      : { year: 2025, monthIndex: 7, monthName: 'August' };
    
    // Filter sales data for the specific month and location
    const monthSalesData = salesData.filter(item => {
      if (!item.paymentDate) return false;
      const date = new Date(item.paymentDate);
      const matchesMonth = date.getFullYear() === monthConfig.year && date.getMonth() === monthConfig.monthIndex;
      const matchesLocation = !location || item.calculatedLocation === location;
      return matchesMonth && matchesLocation && item.paymentStatus === 'succeeded';
    });

    // Build a global customer first purchase map (across ALL data)
    const customerFirstPurchaseMap = new Map<string, Date>();
    salesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId || !item.paymentDate || item.paymentStatus !== 'succeeded') return;
      
      const purchaseDate = new Date(item.paymentDate);
      const existing = customerFirstPurchaseMap.get(customerId);
      if (!existing || purchaseDate < existing) {
        customerFirstPurchaseMap.set(customerId, purchaseDate);
      }
    });

    // Determine if a customer is new in this month
    const isNewCustomerInMonth = (customerId: string, purchaseDate: Date): boolean => {
      const firstPurchase = customerFirstPurchaseMap.get(customerId);
      if (!firstPurchase) return false;
      return firstPurchase.getFullYear() === purchaseDate.getFullYear() &&
             firstPurchase.getMonth() === purchaseDate.getMonth();
    };

    // Check if membership is active at time of purchase
    const hasActiveMembership = (item: SalesData): boolean => {
      if (!item.secMembershipEndDate || !item.paymentDate) return false;
      const endDate = new Date(item.secMembershipEndDate);
      const purchaseDate = new Date(item.paymentDate);
      return endDate >= purchaseDate;
    };

    // Build customer purchase history in this month
    const customerPurchases = new Map<string, SalesData[]>();
    monthSalesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId) return;
      
      if (!customerPurchases.has(customerId)) {
        customerPurchases.set(customerId, []);
      }
      customerPurchases.get(customerId)!.push(item);
    });

    // Calculate overall metrics
    const totalRevenue = monthSalesData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    
    let newClientRevenue = 0;
    let existingClientRevenue = 0;
    let activeMembershipRevenue = 0;
    const newClientIds = new Set<string>();
    const existingClientIds = new Set<string>();
    const clientsWithActiveMembers = new Set<string>();
    
    monthSalesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId) return;
      
      const purchaseDate = new Date(item.paymentDate);
      const isNew = isNewCustomerInMonth(customerId, purchaseDate);
      
      if (isNew) {
        newClientRevenue += item.paymentValue || 0;
        newClientIds.add(customerId);
      } else {
        existingClientRevenue += item.paymentValue || 0;
        existingClientIds.add(customerId);
      }
      
      if (hasActiveMembership(item)) {
        activeMembershipRevenue += item.paymentValue || 0;
        clientsWithActiveMembers.add(customerId);
      }
    });

    // Membership behavior analysis
    const customerMembershipHistory = new Map<string, {
      memberships: string[];
      prices: number[];
      dates: Date[];
    }>();

    monthSalesData
      .filter(item => ['subscription', 'pack'].includes(item.paymentCategory))
      .forEach(item => {
        const customerId = item.memberId || item.customerEmail;
        if (!customerId) return;
        
        if (!customerMembershipHistory.has(customerId)) {
          customerMembershipHistory.set(customerId, {
            memberships: [],
            prices: [],
            dates: []
          });
        }
        
        const history = customerMembershipHistory.get(customerId)!;
        history.memberships.push(item.cleanedProduct || item.paymentItem);
        history.prices.push(item.paymentValue || 0);
        history.dates.push(new Date(item.paymentDate));
      });

    let renewals = 0;
    let upgrades = 0;
    let downgrades = 0;
    
    customerMembershipHistory.forEach((history, customerId) => {
      // Sort by date
      const sorted = history.memberships.map((m, i) => ({
        membership: m,
        price: history.prices[i],
        date: history.dates[i]
      })).sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        
        // Same membership = renewal
        if (prev.membership === curr.membership) {
          renewals++;
        }
        // Higher price = upgrade
        else if (curr.price > prev.price) {
          upgrades++;
        }
        // Lower price = downgrade
        else if (curr.price < prev.price) {
          downgrades++;
        }
      }
    });

    // Stacking (multiple memberships per customer)
    const clientsWithMultipleMemberships = Array.from(customerMembershipHistory.values())
      .filter(h => h.memberships.length > 1).length;
    const stackingMembers = clientsWithMultipleMemberships;

    // Daily analytics
    const dailyMap = new Map<string, {
      revenue: number;
      newRevenue: number;
      existingRevenue: number;
      activeRevenue: number;
      transactions: number;
      newClients: Set<string>;
      existingClients: Set<string>;
      renewals: number;
      upgrades: number;
      downgrades: number;
      stacking: Set<string>;
    }>();

    monthSalesData.forEach(item => {
      const dateKey = new Date(item.paymentDate).toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          revenue: 0,
          newRevenue: 0,
          existingRevenue: 0,
          activeRevenue: 0,
          transactions: 0,
          newClients: new Set(),
          existingClients: new Set(),
          renewals: 0,
          upgrades: 0,
          downgrades: 0,
          stacking: new Set()
        });
      }
      
      const day = dailyMap.get(dateKey)!;
      day.revenue += item.paymentValue || 0;
      day.transactions++;
      
      const customerId = item.memberId || item.customerEmail;
      if (customerId) {
        const purchaseDate = new Date(item.paymentDate);
        if (isNewCustomerInMonth(customerId, purchaseDate)) {
          day.newRevenue += item.paymentValue || 0;
          day.newClients.add(customerId);
        } else {
          day.existingRevenue += item.paymentValue || 0;
          day.existingClients.add(customerId);
        }
        
        if (hasActiveMembership(item)) {
          day.activeRevenue += item.paymentValue || 0;
        }
        
        const purchases = customerPurchases.get(customerId) || [];
        if (purchases.length > 1) {
          day.stacking.add(customerId);
        }
      }
    });

    const dailyAnalytics: DailyAnalytics[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        newClientRevenue: data.newRevenue,
        existingClientRevenue: data.existingRevenue,
        activeMembershipRevenue: data.activeRevenue,
        transactions: data.transactions,
        newClients: data.newClients.size,
        existingClients: data.existingClients.size,
        renewals: data.renewals,
        upgrades: data.upgrades,
        downgrades: data.downgrades,
        stacking: data.stacking.size
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Membership analytics by product and category
    const membershipMap = new Map<string, {
      category: string;
      revenue: number;
      count: number;
      newClients: Set<string>;
      existingClients: Set<string>;
      renewals: number;
      upgrades: number;
      downgrades: number;
    }>();

    monthSalesData.forEach(item => {
      const key = item.cleanedProduct || item.paymentItem || 'Unknown';
      if (!membershipMap.has(key)) {
        membershipMap.set(key, {
          category: item.cleanedCategory || 'Other',
          revenue: 0,
          count: 0,
          newClients: new Set(),
          existingClients: new Set(),
          renewals: 0,
          upgrades: 0,
          downgrades: 0
        });
      }
      
      const membership = membershipMap.get(key)!;
      membership.revenue += item.paymentValue || 0;
      membership.count++;
      
      const customerId = item.memberId || item.customerEmail;
      if (customerId) {
        const purchaseDate = new Date(item.paymentDate);
        if (isNewCustomerInMonth(customerId, purchaseDate)) {
          membership.newClients.add(customerId);
        } else {
          membership.existingClients.add(customerId);
        }
      }
    });

    const membershipAnalytics: MembershipAnalytics[] = Array.from(membershipMap.entries())
      .map(([name, data]) => ({
        membershipName: name,
        cleanedCategory: data.category,
        revenue: data.revenue,
        count: data.count,
        avgPrice: data.count > 0 ? data.revenue / data.count : 0,
        newClients: data.newClients.size,
        existingClients: data.existingClients.size,
        renewals: data.renewals,
        upgrades: data.upgrades,
        downgrades: data.downgrades
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top and bottom spenders
    const spenderMap = new Map<string, {
      name: string;
      email: string;
      total: number;
      transactions: number;
      firstDate: Date;
      lastDate: Date;
      isNew: boolean;
    }>();

    monthSalesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId) return;
      
      if (!spenderMap.has(customerId)) {
        const purchaseDate = new Date(item.paymentDate);
        spenderMap.set(customerId, {
          name: item.customerName,
          email: item.customerEmail,
          total: 0,
          transactions: 0,
          firstDate: purchaseDate,
          lastDate: purchaseDate,
          isNew: isNewCustomerInMonth(customerId, purchaseDate)
        });
      }
      
      const spender = spenderMap.get(customerId)!;
      spender.total += item.paymentValue || 0;
      spender.transactions++;
      
      const itemDate = new Date(item.paymentDate);
      if (itemDate < spender.firstDate) spender.firstDate = itemDate;
      if (itemDate > spender.lastDate) spender.lastDate = itemDate;
    });

    const allSpenders: SpenderData[] = Array.from(spenderMap.entries())
      .map(([id, data]) => ({
        memberId: id,
        customerName: data.name,
        customerEmail: data.email,
        totalSpent: data.total,
        transactions: data.transactions,
        avgTransaction: data.transactions > 0 ? data.total / data.transactions : 0,
        firstPurchaseDate: data.firstDate.toISOString().split('T')[0],
        lastPurchaseDate: data.lastDate.toISOString().split('T')[0],
        isNew: data.isNew
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const topSpenders = allSpenders.slice(0, 20);
    const bottomSpenders = allSpenders.filter(s => s.totalSpent > 0).slice(-20).reverse();

    // Lapsed members analysis
    const lapsedMembers: LapsedMemberData[] = [];
    const now = new Date(monthConfig.year, monthConfig.monthIndex + 1, 0); // Last day of month
    
    const membershipEndMap = new Map<string, {
      endDate: Date;
      membershipType: string;
      lastAmount: number;
    }>();

    // Build membership end dates from sales data
    salesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId || !item.secMembershipEndDate) return;
      
      const endDate = new Date(item.secMembershipEndDate);
      const existing = membershipEndMap.get(customerId);
      
      if (!existing || endDate > existing.endDate) {
        membershipEndMap.set(customerId, {
          endDate,
          membershipType: item.cleanedProduct || item.paymentItem,
          lastAmount: item.paymentValue || 0
        });
      }
    });

    // Find lapsed members (membership ended before this month)
    membershipEndMap.forEach((data, customerId) => {
      if (data.endDate < now) {
        const daysSince = Math.floor((now.getTime() - data.endDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate lifetime value from sales data
        const customerSales = salesData.filter(s => 
          (s.memberId || s.customerEmail) === customerId &&
          s.paymentStatus === 'succeeded'
        );
        const ltv = customerSales.reduce((sum, s) => sum + (s.paymentValue || 0), 0);
        
        const memberData = customerSales[0];
        if (memberData) {
          lapsedMembers.push({
            memberId: customerId,
            customerName: memberData.customerName,
            customerEmail: memberData.customerEmail,
            lastMembershipEndDate: data.endDate.toISOString().split('T')[0],
            daysSinceLapsed: daysSince,
            lastMembershipType: data.membershipType,
            totalLifetimeValue: ltv,
            lastPurchaseAmount: data.lastAmount
          });
        }
      }
    });

    // Sort lapsed members by LTV (highest first)
    lapsedMembers.sort((a, b) => b.totalLifetimeValue - a.totalLifetimeValue);

    // Discount analytics
    const discountData = monthSalesData.filter(item => (item.discountAmount || 0) > 0);
    const totalDiscountGiven = discountData.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const avgDiscountPercentage = discountData.length > 0
      ? discountData.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / discountData.length
      : 0;

    // Visit patterns from checkins
    const monthCheckins = checkinsData.filter(checkin => {
      if (!checkin.dateIST) return false;
      const date = new Date(checkin.dateIST);
      return date.getFullYear() === monthConfig.year && 
             date.getMonth() === monthConfig.monthIndex &&
             (!location || checkin.location === location) &&
             checkin.checkedIn;
    });

    const totalVisits = monthCheckins.length;
    const uniqueVisitors = new Set(monthCheckins.map(c => c.memberId || c.email)).size;
    const avgVisitsPerClient = uniqueVisitors > 0 ? totalVisits / uniqueVisitors : 0;
    const visitToRevenueRatio = totalRevenue > 0 ? totalVisits / (totalRevenue / 1000) : 0;

    return {
      totalRevenue,
      newClientRevenue,
      existingClientRevenue,
      activeMembershipRevenue,
      totalClients: newClientIds.size + existingClientIds.size,
      newClients: newClientIds.size,
      existingClients: existingClientIds.size,
      clientsWithActiveMembers: clientsWithActiveMembers.size,
      clientsWithMultipleMemberships,
      renewals,
      upgrades,
      downgrades,
      stackingMembers,
      dailyAnalytics,
      membershipAnalytics,
      topSpenders,
      bottomSpenders,
      lapsedMembers: lapsedMembers.slice(0, 50), // Top 50 lapsed by LTV
      totalDiscountGiven,
      transactionsWithDiscount: discountData.length,
      avgDiscountPercentage,
      totalVisits,
      avgVisitsPerClient,
      visitToRevenueRatio
    } as OutlierMonthAnalytics;
  }, [salesData, checkinsData, newClientData, month, location]);
};
