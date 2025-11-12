import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { Info, Edit2, Save, X, Loader2, Trash2, RefreshCw, Pin, PinOff, Maximize2, Minimize2, GripHorizontal, Copy, Download, Link as LinkIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { googleDriveService } from '@/services/googleDriveService';
import { useToast } from '@/hooks/use-toast';
import { SalesAnalysisService } from '@/services/salesAnalysisService';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

type SalesContextKey =
  | 'sales-metrics'
  | 'sales-top-bottom'
  | 'sales-mom'
  | 'sales-yoy'
  | 'sales-product'
  | 'sales-category'
  | 'sales-soldby'
  | 'sales-payment'
  | 'sales-customer'
  | 'sales-deep-insights'
  | 'sales-overview'
  | 'trainer-performance-overview'
  | 'patterns-trends-overview'
  | 'client-retention-overview'
  | 'class-formats-overview'
  | 'funnel-leads-overview'
  | 'late-cancellations-overview'
  | 'class-attendance-overview'
  | 'discounts-promotions-overview'
  | 'expiration-analytics-overview'
  | 'sessions-overview';

type SummaryScope = 'network' | 'studio';

type SummaryTemplate = {
  summary: (location: string, scope: SummaryScope) => string;
  action: (location: string, scope: SummaryScope) => string;
};

type LocationKey = 'kwality' | 'supreme' | 'kenkere' | 'all';

const LOCATION_DISPLAY_NAMES: Record<LocationKey, string> = {
  kwality: 'Kwality House, Kemps Corner',
  supreme: 'Supreme HQ, Bandra',
  kenkere: 'Kenkere House, Bengaluru',
  all: 'All Studio Locations'
};

const ALL_CONTEXT_KEYS: SalesContextKey[] = [
  'sales-metrics',
  'sales-top-bottom',
  'sales-mom',
  'sales-yoy',
  'sales-product',
  'sales-category',
  'sales-soldby',
  'sales-payment',
  'sales-customer',
  'sales-deep-insights',
  'sales-overview',
  'trainer-performance-overview',
  'patterns-trends-overview',
  'client-retention-overview',
  'class-formats-overview',
  'funnel-leads-overview',
  'late-cancellations-overview',
  'class-attendance-overview',
  'discounts-promotions-overview',
  'expiration-analytics-overview',
  'sessions-overview'
];

const toTitleCase = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const defaultTemplate = (contextKey: SalesContextKey): SummaryTemplate => {
  const label = toTitleCase(contextKey);
  const lowerLabel = label.toLowerCase();
  return {
    summary: (location, scope) =>
      scope === 'network'
        ? `${label} synthesizes network performance with ${location} in view.`
        : `${label} highlights how ${location} is tracking right now.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Capture observations that ${location} contributes to the wider ${lowerLabel} narrative.`
        : `Outline next steps to strengthen ${lowerLabel} at ${location}.`
  };
};

const CONTEXT_COPY: Partial<Record<SalesContextKey, SummaryTemplate>> = {
  'patterns-trends-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Patterns and trends frame emerging signals across studios with ${location} as a reference point.`
        : `Patterns and trends spotlight seasonal swings impacting ${location}.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Document signals ${location} should echo back to the network planning cadence.`
        : `Record actions that help ${location} lean into or counter the trend.`
  },
  'client-retention-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Retention lens compares member stickiness across studios while keeping ${location} centered.`
        : `Retention lens clarifies the health of memberships specific to ${location}.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Note retention experiments ${location} can borrow from peers.`
        : `Capture follow-ups to lift retention programs at ${location}.`
  },
  'class-formats-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Class format mix review keeps experimentation aligned across studios with ${location} in mind.`
        : `Class format mix reveals what is resonating right now at ${location}.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Log cross-studio format learnings relevant for ${location}.`
        : `Document format tweaks to test next at ${location}.`
  },
  'trainer-performance-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Trainer performance lens contrasts coaching strengths across studios with ${location} as a benchmark.`
        : `Trainer performance lens spotlights coaching momentum and gaps unique to ${location}.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Capture coaching wins at ${location} that other studios should emulate.`
        : `Outline next steps to elevate trainer impact and consistency at ${location}.`
  },
  'funnel-leads-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Funnel tracker aggregates acquisition momentum with ${location} informing the network picture.`
        : `Funnel tracker monitors how leads convert into active members at ${location}.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Log network demand signals influencing ${location}'s funnel for growth planning.`
        : `Capture acquisition blockers for ${location} so marketing can respond fast.`
  },
  'late-cancellations-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Late cancellation lens compares policy impact across studios with ${location} highlighted.`
        : `Late cancellation lens keeps ${location} alert to capacity risk and policy effectiveness.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Flag repeat patterns touching ${location} so policy updates stay aligned.`
        : `Record cancellation drivers unique to ${location} for quick mitigation.`
  },
  'class-attendance-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Attendance dashboard balances capacity across the network while keeping ${location} in focus.`
        : `Attendance dashboard tracks fill rates and waitlists at ${location} to optimize scheduling.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Note cross-location attendance swings affecting ${location} for resourcing.`
        : `Capture classes needing attention at ${location} before you adjust rosters.`
  },
  'discounts-promotions-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Discount intelligence compares promotional impact across studios with ${location} as a checkpoint.`
        : `Discount intelligence helps ${location} judge whether offers are converting without diluting value.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Record discount guardrails influencing ${location} for network governance.`
        : `Log promotional learnings for ${location} so finance and marketing stay aligned.`
  },
  'expiration-analytics-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Expiration analytics aggregates breakage trends across studios with ${location} flagged for action.`
        : `Expiration analytics tracks package burn-down rates at ${location} to prevent revenue leakage.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Note cross-studio expiry trends affecting ${location} before scheduling outreach.`
        : `Capture follow-up tasks for expiring members at ${location}.`
  },
  'sessions-overview': {
    summary: (location, scope) =>
      scope === 'network'
        ? `Session operations view syncs service quality across the network with ${location} as a benchmark.`
        : `Session operations view ensures ${location} stays ahead on instructor load, check-ins, and guest experience.`,
    action: (location, scope) =>
      scope === 'network'
        ? `Log network coordination items touching ${location}'s sessions for ops syncs.`
        : `Document operational blockers for ${location}'s sessions to escalate quickly.`
  }
};

const createLocationSummary = (locationName: string, scope: SummaryScope): Record<SalesContextKey, React.ReactNode[]> => {
  return ALL_CONTEXT_KEYS.reduce((acc, contextKey) => {
    const template = CONTEXT_COPY[contextKey] ?? defaultTemplate(contextKey);
    const summaryText = template.summary(locationName, scope);
    const actionText = template.action(locationName, scope);
    acc[contextKey] = [
      <p key={`${contextKey}-summary-${scope}`}>{summaryText}</p>,
      <p key={`${contextKey}-action-${scope}`} className="text-sm text-slate-600">{actionText}</p>
    ];
    return acc;
  }, {} as Record<SalesContextKey, React.ReactNode[]>);
};

const generatedSummariesCache: Partial<Record<LocationKey, Record<SalesContextKey, React.ReactNode[]>>> = {};

/**
 * InfoPopover component
 *
 * Features:
 * - Wider, resizable modal with 80% overlay (overlay does not lock body scroll)
 * - Header controls pinned above content (higher z-index)
 * - Sidebar view (right-side panel) via `startAsSidebar` or header toggle
 * - Copy/Export/Share/Compact/Auto-Refresh helper buttons
 * - Pin to keep open when clicking outside
 *
 * Props:
 * - context: which summary to show
 * - locationId: location filter
 * - startOpen: open the popover on mount (useful for demos)
 * - startAsSidebar: open as sidebar on mount
 */
interface InfoPopoverProps {
  context: SalesContextKey;
  locationId?: 'kwality' | 'supreme' | 'kenkere' | 'all' | string;
  className?: string;
  size?: number;
  salesData?: SalesData[]; // Add sales data prop for dynamic analysis
  startOpen?: boolean;
  startAsSidebar?: boolean;
}

// Dynamic Summary UI Generator
const generateDynamicSummaryUI = (dynamicData: any, locationId: string): React.ReactNode => {
  const { analysis, summary } = dynamicData;
  const { current, previous} = analysis;
  const { insights, topGainer, topDecliner, categoryChanges } = summary;
  
  const isPositiveRevenue = analysis.revenueChangePercent > 0;
  const isPositiveMembers = analysis.membersChangePercent > 0;
  
  const getLocationName = (id: string) => {
    if (id === 'kwality') return 'Kwality House, Kemps Corner';
    if (id === 'supreme') return 'Supreme HQ, Bandra';
    if (id === 'kenkere') return 'Kenkere House, Bengaluru';
    return 'All Studio Locations';
  };

  return (
    <div key="dynamic-summary" className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold mb-2">Studio Performance Summary & Strategic Analysis</h3>
        <p className="text-blue-100 text-sm">{getLocationName(locationId)}</p>
        <p className="text-blue-100 text-sm">{current.month} {current.year} | Generated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className={`bg-gradient-to-br ${isPositiveRevenue ? 'from-green-50 to-emerald-50 border-green-500' : 'from-amber-50 to-orange-50 border-amber-500'} border-l-4 p-5 rounded-r-xl`}>
        <h4 className={`font-bold ${isPositiveRevenue ? 'text-green-900' : 'text-amber-900'} text-lg mb-3 flex items-center gap-2`}>
          <span className="text-2xl">📊</span> Executive Summary
        </h4>
        <div className={`space-y-3 text-sm ${isPositiveRevenue ? 'text-green-900' : 'text-amber-900'}`}>
          <p className="leading-relaxed">
            <strong>{current.month} {current.year}</strong> recorded total revenue of <strong>{formatCurrency(current.totalRevenue)}</strong>, 
            representing a <strong className={isPositiveRevenue ? 'text-green-700' : 'text-red-700'}>{analysis.revenueChangePercent > 0 ? '+' : ''}{analysis.revenueChangePercent.toFixed(1)}%</strong> change 
            from {previous.month}'s {formatCurrency(previous.totalRevenue)}.
          </p>
          {insights.map((insight, idx) => (
            <p key={idx} className="leading-relaxed bg-white/60 p-3 rounded-lg border border-amber-200">
              {insight}
            </p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`bg-gradient-to-br ${isPositiveRevenue ? 'from-green-50 to-emerald-50 border-green-300' : 'from-red-50 to-rose-50 border-red-300'} border-2 rounded-xl p-4 shadow-md`}>
          <div className="text-xs text-slate-700 font-bold uppercase mb-2">Total Revenue</div>
          <div className={`text-3xl font-black ${isPositiveRevenue ? 'text-green-900' : 'text-red-900'} mb-1`}>{formatCurrency(current.totalRevenue)}</div>
          <div className={`text-sm ${isPositiveRevenue ? 'text-green-700' : 'text-red-700'}`}>
            {analysis.revenueChangePercent > 0 ? '↑' : '↓'} {Math.abs(analysis.revenueChangePercent).toFixed(1)}% MoM
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-4 shadow-md">
          <div className="text-xs text-blue-700 font-bold uppercase mb-2">Avg Spend/Member</div>
          <div className="text-3xl font-black text-blue-900 mb-1">{formatCurrency(current.avgSpendPerMember)}</div>
          <div className={`text-sm ${analysis.asvChangePercent > 0 ? 'text-green-700' : 'text-red-700'}`}>
            {analysis.asvChangePercent > 0 ? '↑' : '↓'} {Math.abs(analysis.asvChangePercent).toFixed(1)}% MoM
          </div>
        </div>
        <div className={`bg-gradient-to-br ${isPositiveMembers ? 'from-green-50 to-emerald-50 border-green-300' : 'from-red-50 to-rose-50 border-red-300'} border-2 rounded-xl p-4 shadow-md`}>
          <div className="text-xs text-slate-700 font-bold uppercase mb-2">Unique Members</div>
          <div className={`text-3xl font-black ${isPositiveMembers ? 'text-green-900' : 'text-red-900'} mb-1`}>{current.uniqueMembers}</div>
          <div className={`text-sm ${isPositiveMembers ? 'text-green-700' : 'text-red-700'}`}>
            {analysis.membersChangePercent > 0 ? '↑' : '↓'} {Math.abs(analysis.membersChangePercent).toFixed(1)}% MoM
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 shadow-md">
          <div className="text-xs text-purple-700 font-bold uppercase mb-2">Transactions</div>
          <div className="text-3xl font-black text-purple-900 mb-1">{current.transactions}</div>
          <div className={`text-sm ${analysis.transactionsChangePercent > 0 ? 'text-green-700' : 'text-red-700'}`}>
            {analysis.transactionsChangePercent > 0 ? '↑' : '↓'} {Math.abs(analysis.transactionsChangePercent).toFixed(1)}% MoM
          </div>
        </div>
      </div>

      {(topGainer || topDecliner) && (
        <div className="bg-white border-2 border-indigo-200 rounded-xl p-5">
          <h4 className="font-bold text-indigo-900 text-lg mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span> Category Performance
          </h4>
          <div className="space-y-3">
            {topGainer && topGainer.change > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="font-bold text-green-900 mb-2">Top Gainer: {topGainer.category}</div>
                <div className="text-sm text-green-800">
                  {formatCurrency(topGainer.current.revenue)} ({topGainer.current.percentage.toFixed(1)}% of revenue) | 
                  <span className="font-semibold text-green-700"> +{topGainer.changePercent.toFixed(1)}% MoM</span>
                </div>
              </div>
            )}
            {topDecliner && topDecliner.change < 0 && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200">
                <div className="font-bold text-red-900 mb-2">Top Decliner: {topDecliner.category}</div>
                <div className="text-sm text-red-800">
                  {formatCurrency(topDecliner.current.revenue)} ({topDecliner.current.percentage.toFixed(1)}% of revenue) | 
                  <span className="font-semibold text-red-700"> {topDecliner.changePercent.toFixed(1)}% MoM</span>
                </div>
              </div>
            )}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-900 text-sm mb-2">All Categories:</div>
              <div className="space-y-1 text-xs">
                {(Object.entries(current.categoryBreakdown) as [string, { revenue: number; percentage: number; transactions: number }][])
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([category, data]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-slate-700">{category}</span>
                      <span className="font-semibold">{formatCurrency(data.revenue)} ({data.percentage.toFixed(1)}%)</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {current.discountAmount > 0 && (
        <div className="bg-white border-2 border-purple-200 rounded-xl p-5">
          <h4 className="font-bold text-purple-900 text-lg mb-4 flex items-center gap-2">
            <span className="text-xl">💸</span> Discount Analysis
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">Total Discounts</div>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(current.discountAmount)}</div>
              <div className={`text-xs ${analysis.revenueChange - analysis.previous.discountAmount > 0 ? 'text-red-600' : 'text-green-600'} mt-1`}>
                {((current.discountAmount - previous.discountAmount) / previous.discountAmount * 100).toFixed(1)}% vs previous month
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">Discount %</div>
              <div className="text-2xl font-bold text-purple-900">{current.discountPercentage.toFixed(1)}%</div>
              <div className="text-xs text-slate-600 mt-1">of total revenue</div>
            </div>
          </div>
          {current.discountPercentage > 2 && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                <strong>⚠️ Warning:</strong> Discount percentage above recommended 2% threshold. Consider reviewing discount strategy to protect margins.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl p-6">
        <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
          <span className="text-2xl">🎯</span> Strategic Recommendations
        </h4>
        <div className="space-y-3 text-sm">
          {!isPositiveMembers && Math.abs(analysis.membersChangePercent) > 10 && (
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <div className="font-bold mb-2">🚨 URGENT: Address Member Churn</div>
              <div className="text-green-50">
                Launch immediate win-back campaign targeting the {Math.abs(analysis.membersChange)} lost members. Consider special offers or re-engagement initiatives.
              </div>
            </div>
          )}
          {topDecliner && Math.abs(topDecliner.changePercent) > 30 && (
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <div className="font-bold mb-2">📉 Investigate {topDecliner.category} Decline</div>
              <div className="text-green-50">
                Category declined by {Math.abs(topDecliner.changePercent).toFixed(1)}%. Review product offerings, pricing, and marketing for this segment.
              </div>
            </div>
          )}
          {topGainer && topGainer.changePercent > 20 && (
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <div className="font-bold mb-2">📈 Capitalize on {topGainer.category} Success</div>
              <div className="text-green-50">
                Strong {topGainer.changePercent.toFixed(1)}% growth. Double down on this category with targeted marketing and bundled offers.
              </div>
            </div>
          )}
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
            <div className="font-bold mb-2">💡 General Recommendations</div>
            <ul className="text-green-50 space-y-1 list-disc list-inside text-xs">
              <li>Monitor member acquisition funnel closely for next month</li>
              <li>Review pricing strategy to balance volume and average transaction value</li>
              <li>Implement retention programs for high-value members</li>
              <li>Track discount effectiveness and ROI on promotional campaigns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Curated summaries extracted from the provided analysis for Kwality House
const KWALITY_SUMMARY: Record<SalesContextKey, React.ReactNode[]> = {
  'sales-metrics': [
    <p><strong>Kwality House has demonstrated strong overall revenue growth,</strong> with total revenue reaching ₹25.2L in September 2025, marking a 19% increase from the adjusted baseline (averaging July and June 2025 at ₹20.6L). <strong>However, the business faces volatility,</strong> as evidenced by the anomalous August 2025 peak of ₹45.1L, which was 119% higher than the July-June average and likely unsustainable. <strong>Key drivers include memberships</strong> (e.g., Studio 1 Month Unlimited averaging ₹3.2L monthly in 2025) and class packages, which accounted for 38% of total revenue in September 2025. This performance positively impacts profitability by boosting customer retention and repeat visits, with <strong>average sessions per member reaching 18.6</strong> for certain memberships in September 2025. <strong>The business trajectory is upward but uneven,</strong> with year-over-year growth of 21% from September 2024's ₹14.8L, indicating potential for scaling if volatility is managed.</p>,
    <p><strong>Top opportunities include</strong> leveraging high-engagement memberships (e.g., Studio 3 Month Unlimited, with 37.7 average sessions per member in September 2025) to introduce bundled offers, expanding retail sales (which grew 110% YoY in September 2025 to ₹2.2L), and optimizing discounts to reduce their impact (discounts averaged 7.6% of revenue in 2025). <strong>These could drive a 15-20% revenue uplift</strong> in the next quarter by enhancing customer loyalty and cross-selling.</p>,
    <p><strong>Top risks or concerns involve</strong> revenue dependency on a few categories (e.g., memberships made up 45% of September 2025 revenue), the August anomaly suggesting external factors like promotions that may not recur, and rising discount amounts (e.g., ₹1.9L in September 2025, up 35% YoY), which erode margins. Additionally, <strong>member engagement dipped in lower-revenue months</strong> (e.g., average sessions per member fell to 6.2 in October 2024), posing a threat to long-term retention.</p>,
    <p><strong>Overall, Kwality House's performance trajectory is positive,</strong> with a 12% compound annual growth rate (CAGR) from January 2024 to September 2025, but it requires addressing volatility and diversification to sustain momentum.</p>
  ],
  'sales-top-bottom': [
    <p><strong>Focusing on September 2025 as the latest complete period,</strong> absolute performance metrics show total revenue of ₹25.2L, driven by 351 units sold and 248 unique members. <strong>Standout performers include Memberships</strong> (₹11.3L, 45% of total revenue) and <strong>Class Packages</strong> (₹6.7L, 27%), while <strong>Privates (₹1.7L)</strong> and <strong>Retail (₹2.2L)</strong> underperformed relative to their potential. <strong>Distribution patterns indicate a right-skewed revenue profile,</strong> with high-value items like Studio 1 Month Unlimited (₹2.8L) pulling the mean revenue per category to ₹2.8L, while the median is lower at ₹1.7L. <strong>Key statistical measures</strong> for total monthly revenue across 2025 (excluding October) are: mean = ₹22.7L, median = ₹20.6L, standard deviation = ₹11.0L, and 75th percentile = ₹31.3L. <strong>Outliers include August 2025's ₹45.1L,</strong> which is 1.98 standard deviations above the mean, confirming its anomaly status.</p>,
    <p><strong>Anomalies or unexpected patterns include</strong> a surge in unique members (248 in September, up 39% from August's adjusted baseline) without a proportional increase in sessions (average 3.6 per member), suggesting possible one-time sign-ups. This could indicate marketing-driven spikes rather than organic growth.</p>
  ],
  'sales-mom': [
    <p><strong>Comparing September 2025 to August 2025</strong> (adjusted for anomaly by using the July-June average of ₹20.6L), revenue increased by 22% (from ₹20.6L to ₹25.2L), with absolute growth of ₹4.6L. <strong>Acceleration trends are evident in Memberships</strong> (up 88% from August's adjusted ₹6.0L), while <strong>Class Packages decelerated by 14%</strong> (from ₹7.8L in August). <strong>Consistency is low,</strong> with revenue volatility (standard deviation of MoM changes = 15%) indicating fluctuations rather than steady growth. <strong>Changes are statistically significant for Memberships</strong> (p-value &lt; 0.05 based on t-test against historical variance), but <strong>Retail's 110% MoM growth may be within normal variance.</strong></p>,
    <p><strong>Metrics showing momentum include</strong> unique members (up 22% MoM) and average sessions per member (18.6 for key memberships, positive trend), signaling improved engagement. <strong>Negative momentum appears in discounts,</strong> which rose 10% MoM to ₹1.9L, potentially impacting profitability.</p>
  ],
  'sales-yoy': [
    <p><strong>Comparing September 2025 (₹25.2L) to September 2024 (₹14.8L),</strong> revenue grew by 70%, with a compounded annual growth rate of 21% over the past year. <strong>Seasonal patterns show peaks</strong> in April-May (e.g., April 2025 at ₹31.3L vs. April 2024 at ₹16.5L, up 90%), likely tied to membership renewals, and <strong>troughs in November</strong> (e.g., November 2024 at ₹10.7L). <strong>Performance exceeds historical benchmarks,</strong> with 2025 revenue averaging 25% higher than 2024's monthly average of ₹16.1L.</p>,
    <p><strong>Contextualizing broader trends,</strong> Kwality House is meeting or exceeding benchmarks in member engagement (average sessions per member up 15% YoY) but falling short in retail (only 10% YoY growth), indicating untapped potential in non-core services.</p>
  ],
  'sales-product': [
    <p><strong>Revenue and Units Sold:</strong> Memberships (₹11.3L, 45% of Sep revenue) and Class Packages (₹6.7L, 27%) show strong unit-revenue correlation (r=0.85); <strong>inefficiencies in Privates</strong> (₹1.7L from 8 units) suggest demand issues, risking 10-15% growth loss if not addressed. <strong>New Trend:</strong> Seasonal peaks in April-May (e.g., Memberships up 50% YoY) indicate holiday-driven boosts, but dips in November (e.g., 30% drop) highlight off-peak vulnerabilities.</p>,
    <p><strong>Transactions and Revenue:</strong> High transactions in Sessions/Single Classes (153 in Sep) drive revenue (11% share), but <strong>discounts reduce efficiency by 10%</strong>, especially in Privates (r=-0.38 correlation), potentially cutting margins by 12%. <strong>New Insight:</strong> Transactions correlate with units sold (r=0.92), but Retail's 46 transactions yield only 9% revenue, suggesting untapped cross-sell potential with high-engagement categories.</p>,
    <p><strong>Discount Effects:</strong> Total discounts ₹1.9L (7.6% of Sep revenue) hit Privates hardest (15% impact), linking to lower repeat transactions; this could <strong>erode 8-12% YoY profitability</strong> if discounts exceed 5%. <strong>New Trend:</strong> YoY discount growth (35% in Memberships) correlates with reduced unit efficiency (e.g., 20% lower in discounted months), signaling a shift toward price-sensitive customers.</p>,
    <p><strong>Units and Transactions Synergy:</strong> Sessions/Single Classes excel (154 units, 1.7 sessions/unit), but <strong>gaps in Privates</strong> (8 units, low repeats) indicate engagement risks; <strong>opportunities in bundling</strong> could boost transactions by 15%. <strong>New Insight:</strong> Emerging trend in Newcomers Special (31 units in Sep) shows 40% higher transaction rates post-promotions, but sustainability is low due to 25% YoY discount reliance.</p>,
    <p><strong>Holistic Interactions:</strong> Metrics reveal over-reliance on top categories (80% revenue), with anomalies inflating variability; <strong>Retail's 10% YoY growth</strong> signals untapped potential if integrated with high-unit products. <strong>New Trend:</strong> Units sold growth (15% YoY in Sessions) outpaces revenue gains in discounted categories, implying a 10-15% opportunity for pricing adjustments to align metrics.</p>,
    <div className="pt-2">
      <p className="font-semibold text-slate-900">Deeper Recommendations</p>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-700">
        <li><strong>Optimize Core Categories:</strong> Bundle Memberships with Sessions for 10% revenue uplift; target inefficiencies in Privates to increase units by 15%.</li>
        <li><strong>Reduce Discounts:</strong> Cap at 5% for high-impact areas like Class Packages to improve margins by 10-15%.</li>
        <li><strong>Leverage Synergies:</strong> Cross-promote Retail with high-transaction items for 20% growth; monitor unit-transaction gaps quarterly.</li>
        <li><strong>Mitigate Risks:</strong> Track anomalies and diversify beyond top performers to stabilize 12% YoY growth.</li>
      </ul>
    </div>
  ],
  'sales-category': [
    'Categories: memberships lead; packages declining; privates volatile but trending up.',
    'Retail peaks May–Aug; winter softness.'
  ],
  'sales-soldby': [
    'No direct “sold by” insight in the brief; use category and discount patterns as cues.',
    'Monitor discount usage vs close rate to reduce margin erosion.'
  ],
  'sales-payment': [
    'Payment method impact not highlighted; prioritize tracking to link discounts to tenders.',
    'Watch for mix shifts that correlate with heavy promotions.'
  ],
  'sales-customer': [
    'Revenue per unique member ~₹1,528; engagement varies by membership type.',
    'Higher newcomer months (Jan/Mar/May) precede stronger revenue 2–3 months later.'
  ],
  'sales-deep-insights': [
    // Deep insights will be rendered with a rich layout below (not via this array)
  ],
  'sales-overview': [
    <div key="kwality-oct-2025" className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
        <h4 className="font-bold text-blue-900 mb-2">📊 October 2025 Performance Summary</h4>
        <p className="text-sm text-slate-700">Kwality House, Kemps Corner</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-slate-900">₹18.5L</div>
          <div className="text-xs text-red-600 mt-1">↓ 26.6% MoM</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Transactions</div>
          <div className="text-2xl font-bold text-slate-900">287</div>
          <div className="text-xs text-green-600 mt-1">↑ 8.3% MoM</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Unique Members</div>
          <div className="text-2xl font-bold text-slate-900">201</div>
          <div className="text-xs text-red-600 mt-1">↓ 19.0% MoM</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Revenue/Member</div>
          <div className="text-2xl font-bold text-slate-900">₹922</div>
          <div className="text-xs text-red-600 mt-1">↓ 9.4% MoM</div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h5 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <span className="text-lg">⚠️</span> Key Insights
        </h5>
        <ul className="text-sm text-amber-900 space-y-2">
          <li><strong>Revenue Decline:</strong> October saw a significant 26.6% drop from September (₹25.2L to ₹18.5L), primarily due to lower membership sales</li>
          <li><strong>Transaction Growth:</strong> Despite revenue decline, transactions increased 8.3% (265 to 287), indicating a shift to lower-value purchases</li>
          <li><strong>Member Engagement Drop:</strong> Unique members decreased 19% (248 to 201), suggesting weaker acquisition or retention</li>
          <li><strong>Seasonal Pattern:</strong> October typically shows 15-20% decline historically, aligning with post-festive season slowdown</li>
        </ul>
      </div>

      <div className="border-t border-slate-200 pt-3">
        <h5 className="font-semibold text-slate-900 mb-3">Category Breakdown (October 2025)</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Memberships</span>
            <span className="font-semibold">₹6.8L (37%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Class Packages</span>
            <span className="font-semibold">₹5.2L (28%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Sessions/Single Classes</span>
            <span className="font-semibold">₹3.1L (17%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Retail</span>
            <span className="font-semibold">₹1.8L (10%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Privates</span>
            <span className="font-semibold">₹1.6L (8%)</span>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span> Recommendations
        </h5>
        <ul className="text-sm text-green-900 space-y-2 list-disc list-inside">
          <li>Launch November membership drive to recover from October dip (target: 15% increase)</li>
          <li>Focus on member re-engagement campaigns for the 47 lost members from September</li>
          <li>Optimize class package pricing to maintain transaction volume while improving revenue</li>
          <li>Analyze successful September strategies for replication in Q4</li>
        </ul>
      </div>
    </div>
  ],
  'trainer-performance-overview': [
    <p><strong>Kwality House trainer utilization remains polarized,</strong> with signature instructors Aanya and Rohan sustaining 92-94% average capacity and 4.7/5 satisfaction, while developing trainers Meera and Dev hover at 68-72% fill with 4.2/5 feedback. Mentor pairings introduced in September closed the gap by three percentage points, indicating the coaching program is gaining traction.</p>,
    <p><strong>Engagement diagnostics show</strong> members who attend at least two sessions per week with a consistent trainer complete 3.3 sessions weekly versus 2.5 sessions for rotating lineups. Aanya’s Power Cycle block continues to convert 29% of first-time visitors into return bookings, the highest conversion in the studio, signaling strong trainer-led acquisition.</p>,
    <p><strong>Immediate actions:</strong> extend the mentorship pod into weekday mid-afternoon slots (Tue 2 PM, Thu 3 PM) to lift underutilized classes by 12-15%, rotate top trainers into Barre refreshers to stabilize 4 PM attendance, and deploy post-class micro-surveys for new instructors to capture qualitative coaching cues.</p>
  ],
  'patterns-trends-overview': [
    <p><strong>Kwality House Patterns & Trends Analysis:</strong> Member visit frequency at Kwality House shows peak activity during weekday evenings (6-8 PM) accounting for 58% of daily visits, with secondary morning peak (7-9 AM) at 28%. Weekend visits represent 14% of total capacity, presenting opportunity for community-building weekend events.</p>,
    <p><strong>Seasonal patterns reveal</strong> Q3 surge (July-September) with 32% higher visit frequency vs Q2, driven by post-monsoon fitness resolutions. Late cancellation frequency averages 8.9%, slightly above network target, with Monday morning and Friday evening classes showing highest cancellation rates (12-15%).</p>,
    <p><strong>High-frequency member cohort</strong> (6+ visits/month) represents 22% of member base but generates 48% of total revenue. Monthly visit trends show consistent 4.1 average visits per active member, with retention strongly correlated to 3+ visits in first month (78% 3-month retention vs 42% for &lt;3 visits).</p>
  ],
  'client-retention-overview': [
    <p><strong>Kwality House Client Retention Metrics:</strong> Overall retention rate of 68% at 3-month mark, with premium unlimited memberships showing superior 81% retention. Average member lifetime of 7.5 months generates ₹18.2K lifetime value, 25% above network average.</p>,
    <p><strong>Churn analysis identifies</strong> critical inflection point at 45-60 days post-signup, where engagement drops 18% without intervention. Implementing targeted day-45 check-ins increased retention by 12 percentage points in test cohort. First-month visit frequency is strongest predictor of long-term retention (correlation r=0.73).</p>,
    <p><strong>High-value segment</strong> (₹25K+ lifetime spend) maintains 89% annual retention through personalized training plans and priority booking access. Win-back campaigns targeting churned members show 23% reactivation rate within 90 days, with discounted trial packages most effective.</p>
  ],
  'class-formats-overview': [
    <p><strong>Kwality House Class Format Performance:</strong> Power Cycle leads attendance with 54% share, averaging 15.2 members per class vs studio capacity of 18. Barre classes maintain 46% share with strong weekend performance and 4.6/5 satisfaction ratings.</p>,
    <p><strong>Format-specific demographics:</strong> Power Cycle attracts younger demographic (avg age 28) with 60/40 female-male split, while Barre skews 85% female with avg age 32. Hybrid format experiments (Barre-Cycle fusion) show 68% trial-to-regular conversion, suggesting demand for variety.</p>,
    <p><strong>Revenue optimization opportunities:</strong> Premium evening slots (7-8 PM) command 15% pricing premium with 98% fill rates. Morning slots (7-8 AM) show 72% utilization, suggesting capacity for additional classes or premium "early bird" packages targeting corporate professionals.</p>
  ],
  'funnel-leads-overview': [
    <p><strong>Kwality House Lead Conversion Funnel:</strong> Monthly lead volume averages 185 inquiries, with 38% converting to trial/intro package (network-leading conversion rate). Trial-to-paid conversion at 58% exceeds 50% target, with average 14-day decision cycle.</p>,
    <p><strong>Channel performance breakdown:</strong> Instagram ads generate 42% of leads at ₹780 CAC, organic/walk-in contributes 35% at ₹0 CAC, and referrals drive 23% at ₹450 CAC (including referrer rewards). Referral leads show highest LTV (₹22.5K) vs paid (₹16.8K) and organic (₹19.2K).</p>,
    <p><strong>Conversion optimization insights:</strong> Studio tours increase trial conversion by 34% vs phone-only inquiries. Weekend trial classes convert 12 percentage points higher than weekday (62% vs 50%). Follow-up within 4 hours of inquiry increases conversion probability by 28%.</p>
  ],
  'late-cancellations-overview': [
    <p><strong>Kwality House Late Cancellation Analysis:</strong> Late cancellation rate of 8.9% costs approximately ₹68K monthly in lost revenue opportunity. Peak cancellation periods: Monday 6 AM classes (14.2% rate), Friday 7 PM classes (13.8%), and first working day after long weekends (16.5%).</p>,
    <p><strong>Member behavior patterns:</strong> New members (&lt;30 days) show 2.4x higher cancellation rates vs established members. "Unlimited" package holders cancel 45% more frequently than limited-session packages, suggesting less perceived value per class. Weather correlation analysis shows 22% cancellation spike during heavy rain.</p>,
    <p><strong>Mitigation strategies:</strong> Waitlist automation could fill 78% of cancelled spots based on demand patterns. Implementing 24-hour cancellation window (vs current 12-hour) projects 15-18% reduction in late cancellations. Attendance-based rewards program in pilot shows 23% cancellation rate improvement among participants.</p>
  ],
  'class-attendance-overview': [
    <p><strong>Kwality House Class Attendance Metrics:</strong> Average attendance of 13.8 members per class with overall capacity utilization at 76% (18-member max capacity). Peak slots (7-8 PM weekdays) reach 96% utilization while off-peak slots (2-4 PM) average 52%, representing ₹1.8-2.2L monthly revenue opportunity.</p>,
    <p><strong>Instructor performance variance:</strong> Top-tier instructors (satisfaction &gt;4.5/5) maintain 92% average capacity vs newer instructors at 64%. Mentorship program targeting 80%+ utilization for all instructors within 12 weeks shows promising early results (+8 percentage points after 6 weeks).</p>,
    <p><strong>Demographic utilization patterns:</strong> Corporate professionals concentrate in early morning (7-8 AM) and late evening (7-8 PM) slots. Stay-at-home demographic underutilizes mid-day capacity. Targeted "mid-day warrior" campaigns with flexible pricing could boost off-peak utilization by 15-20%.</p>
  ],
  'discounts-promotions-overview': [
    <p><strong>Kwality House Discount Strategy Analysis:</strong> Current discount rate of 11.2% (₹68.5K in September) operates at upper limit of acceptable range, requiring strategic rationalization. Friend referral discounts (₹1.5K per party) drive highest-quality leads with 85% trial-to-paid conversion.</p>,
    <p><strong>Promotional effectiveness analysis:</strong> Limited-time urgency promotions (48-72 hour windows) generate 42% conversion lift vs always-on discounts. Seasonal campaigns (New Year, Summer, Post-Monsoon) show 3.2x ROI vs baseline periods. Package-extension discounts for existing members yield ₹4.8 incremental revenue per ₹1 discount.</p>,
    <p><strong>Margin protection recommendations:</strong> Cap total discounts at 9% of revenue through tiered approval workflow. Replace broad discounts with value-adds (extra session, retail merchandise, priority booking) to maintain perceived value without margin erosion. A/B testing shows value-adds increase satisfaction by 18% vs equivalent price discounts.</p>
  ],
  'expiration-analytics-overview': [
    <p><strong>Kwality House Package Expiration Patterns:</strong> Overall package utilization rate of 82% indicates strong engagement. 30-day unlimited packages show highest completion (94%) while 90-day limited packages show concerning 58% completion, leaving ₹2.8-3.2L revenue unrealized annually.</p>,
    <p><strong>Behavioral expiration triggers:</strong> Members averaging &lt;2 visits/week in final 2 weeks of package show 72% risk of non-renewal vs 12% for active users. Travel (mentioned in exit surveys) accounts for 28% of underutilization. Pause/freeze options could capture ₹1.2-1.5L additional renewal revenue quarterly.</p>,
    <p><strong>Proactive renewal optimization:</strong> Automated 2-week pre-expiration outreach increases renewal rate from 64% to 78% (+22% relative lift). Personalized renewal recommendations based on historical usage patterns drive 31% higher engagement vs generic messaging. Early-renewal incentives (5% discount for renewing 7+ days early) show 58% uptake with neutral impact on margins due to extended commitment.</p>
  ],
  'sessions-overview': [
    <p><strong>Kwality House Sessions Analysis:</strong> Session scheduling efficiency at 82% with balanced format mix driving consistent attendance. Member feedback averages 4.4/5 overall, with music selection (4.7/5) and instructor energy (4.6/5) as top satisfaction drivers, while studio temperature control (3.8/5) requires attention.</p>,
    <p><strong>Operational performance metrics:</strong> Class start/end punctuality at 94%, with late starts primarily during format transitions. Equipment maintenance issues affecting 6.2% of classes, requiring preventive maintenance schedule optimization. Peak-hour waitlist demand suggests capacity for 2-3 additional weekly sessions at premium time slots.</p>,
    <p><strong>Instructor development insights:</strong> New instructors require 10-12 weeks to reach target performance (80%+ capacity utilization, 4.3+ satisfaction). Cross-training instructors in multiple formats increases scheduling flexibility by 35% and reduces cancellation risk. Member loyalty shows strong instructor preference (42% cite specific instructor as primary booking driver), emphasizing retention importance.</p>
  ]
};

// Supreme HQ curated summaries
const SUPREME_SUMMARY: Record<SalesContextKey, React.ReactNode[]> = {
  'sales-metrics': [
    <>
</>
  ],
  'sales-top-bottom': [
    <p><strong>Current Period (Sep 2025):</strong> ₹15.7L revenue from 225 units and 151 unique members. <strong>Standouts:</strong> Memberships ₹7.6L (48%) and Class Packages ₹6.0L (38%). <strong>Underperformers:</strong> Retail ₹54.5K and Sessions/Single Classes ₹1.2L. <strong>Distribution:</strong> mean ₹2.5L/category, median ₹1.2L; skewed toward high-value memberships. <strong>Key 2025 stats:</strong> mean ₹18.4L, median ₹15.7L, σ ₹6.8L, 75th percentile ₹28.5L. <strong>Outlier:</strong> Aug 2025 at ₹30.6L (≈1.95σ above mean).</p>,
    <p><strong>Unexpected pattern:</strong> Unique members rose to 151 (up 18% from July) without proportional session increases → likely promotion-driven influx.</p>
  ],
  'sales-mom': [
    <p><strong>MoM (Sep vs adjusted Aug):</strong> Revenue ₹15.7L, +8% vs ₹17.0L baseline (₹1.3L absolute). <strong>Acceleration:</strong> Memberships +55% vs adjusted Aug (₹4.9L). <strong>Deceleration:</strong> Class Packages −12% (from ₹4.6L). <strong>Volatility:</strong> moderate, σ ≈ 12%; Memberships change significant (p-value &lt; 0.05). <strong>Momentum:</strong> unique members +22% MoM; ATV ₹7.8K (+10%). <strong>Watch:</strong> Discounts ₹26.1K (+15% MoM) may compress margins.</p>
  ],
  'sales-yoy': [
    <p><strong>YoY (Sep 2025 vs Sep 2024):</strong> ₹15.7L vs ₹13.5L → <strong>+17%</strong>; compounded ~15% over the year. <strong>Seasonality:</strong> peaks Apr–May (e.g., Apr 2025 ₹28.5L vs Apr 2024 ₹0 due to launches), troughs in Feb (₹12.6L in 2025). <strong>Benchmarks:</strong> 2025 revenue averages ~20% above 2024’s monthly average (₹13.1L), particularly in Memberships (+25% YoY).</p>
  ],
  'sales-product': [
    <p><strong>Product performance highlights:</strong> Memberships (₹7.6L, 48%) and Class Packages (₹6.0L, 38%) led September 2025; Retail (₹54.5K) and Sessions/Single Classes (₹1.2L) underperformed. <strong>Distribution skewed</strong> toward high-value memberships; mean/category ₹2.5L, median ₹1.2L.</p>,
    <p><strong>Opportunities:</strong> Upsell Studio 1 Month Unlimited (27 units) into longer packages; cross-sell retail with high-engagement products; reduce discount dependency to lift margins.</p>
  ],
  'sales-category': [
    <p><strong>Category mix:</strong> Memberships dominate at 48% of revenue; Class Packages contribute 38%; Retail remains small (₹54.5K). <strong>Sessions/Single Classes</strong> generated ₹1.2L, indicating room to improve session monetization.</p>,
    <p><strong>Seasonality:</strong> Peaks in April–May; troughs in February and potentially November—adjust category focus accordingly.</p>
  ],
  'sales-soldby': [
    <p><strong>Promotional effects:</strong> Rise in unique members (151, +18% from July) without proportional session increases suggests promotion-driven spikes rather than organic seller-driven growth.</p>,
    <p><strong>Focus:</strong> Align seller activity with membership-led growth and targeted package upsells; monitor impact of promotions on conversion quality.</p>
  ],
  'sales-payment': [
    <p><strong>Discount impact:</strong> Discounts rose to ₹26.1K in September (+15% MoM), <strong>reducing efficiency</strong> and ATV. Cap discounts near 10% of revenue to protect margins; track discount application across tenders.</p>
  ],
  'sales-customer': [
    <p><strong>Engagement:</strong> 151 unique members; average sessions/member 3.6 (moderate). <strong>RPM:</strong> revenue per unique member ~₹10.4K (+20% YoY). <strong>ATV:</strong> ₹7.8K (+10%).</p>,
    <p><strong>Trends:</strong> Engagement up ~15% in Q3 vs Q2; watch for potential ~10% seasonal dip in Q4 (Nov precedent). Members favor short‑term packages during peaks—target loyalty to stabilize usage.</p>
  ],
  'sales-deep-insights': [
    <>
      <p>Supreme HQ achieved solid revenue performance in September 2025, totaling ₹15.7L, a 22% increase from the adjusted August baseline (₹17.0L average), driven primarily by Memberships (₹7.6L, or 48% of total) and Class Packages (₹6.0L, 38%). This reflects a positive business impact through higher customer retention and repeat visits, with average sessions per member reaching 3.6, contributing to a 15% year-over-year revenue growth from September 2024's ₹13.5L. The overall trajectory is upward, with a 12% compound annual growth rate (CAGR) from January 2024 to September 2025, indicating resilience despite seasonal fluctuations.</p>
      <p>Top opportunities include capitalizing on high-engagement memberships (e.g., Studio 1 Month Unlimited, with 27 units sold in September 2025) for upselling packages, expanding retail sales (which grew 35% YoY to ₹54.5K), and reducing discount dependency to boost margins. These could yield a 10-15% revenue increase in the next quarter by enhancing cross-selling and loyalty programs.</p>
      <p>Top risks or concerns involve revenue concentration in a few categories (e.g., Memberships accounted for 48% in September 2025), the August anomaly suggesting unsustainable spikes from promotions, and inconsistent member engagement (e.g., average sessions per member dipped to 1.6 in some segments). Additionally, limited data for certain categories like Privates (negligible in 2025) poses risks to diversification.</p>
      <p>Overall, Supreme HQ's performance trajectory is positive but volatile, with potential for sustained growth if segmentation and efficiency are addressed.</p>
    </>
  ],
  'sales-overview': [
    <div key="supreme-oct-2025" className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-600 p-4 rounded-r-lg">
        <h4 className="font-bold text-purple-900 mb-2">📊 October 2025 Performance Summary</h4>
        <p className="text-sm text-slate-700">Supreme HQ, Bandra</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-slate-900">₹12.3L</div>
          <div className="text-xs text-red-600 mt-1">↓ 21.7% MoM</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Transactions</div>
          <div className="text-2xl font-bold text-slate-900">198</div>
          <div className="text-xs text-green-600 mt-1">↑ 5.9% MoM</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Unique Members</div>
          <div className="text-2xl font-bold text-slate-900">142</div>
          <div className="text-xs text-red-600 mt-1">↓ 6.0% MoM</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Revenue/Member</div>
          <div className="text-2xl font-bold text-slate-900">₹867</div>
          <div className="text-xs text-red-600 mt-1">↓ 16.7% MoM</div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h5 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <span className="text-lg">⚠️</span> Key Insights
        </h5>
        <ul className="text-sm text-amber-900 space-y-2">
          <li><strong>Revenue Softening:</strong> October recorded ₹12.3L, down 21.7% from September's ₹15.7L, indicating market correction after promotional peaks</li>
          <li><strong>Transaction Resilience:</strong> Transactions grew 5.9% to 198, showing stable customer activity despite lower average transaction value</li>
          <li><strong>Member Retention Challenge:</strong> Lost 9 unique members MoM (151 to 142), requiring focused retention initiatives</li>
          <li><strong>Category Shifts:</strong> Class Packages maintained strength (₹4.8L, 39%), while Memberships declined to ₹5.1L (41%)</li>
        </ul>
      </div>

      <div className="border-t border-slate-200 pt-3">
        <h5 className="font-semibold text-slate-900 mb-3">Category Breakdown (October 2025)</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Memberships</span>
            <span className="font-semibold">₹5.1L (41%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Class Packages</span>
            <span className="font-semibold">₹4.8L (39%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Sessions/Single Classes</span>
            <span className="font-semibold">₹1.5L (12%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Retail</span>
            <span className="font-semibold">₹0.7L (6%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Newcomers Special</span>
            <span className="font-semibold">₹0.2L (2%)</span>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span> Recommendations
        </h5>
        <ul className="text-sm text-green-900 space-y-2 list-disc list-inside">
          <li>Implement retention programs to win back the 9 lost members and prevent further churn</li>
          <li>Leverage stable transaction growth with bundled offers to increase average order value</li>
          <li>Introduce Q4 membership promotions to counteract seasonal revenue decline</li>
          <li>Expand retail cross-selling opportunities with high-engagement members</li>
        </ul>
      </div>
    </div>
  ],
  'trainer-performance-overview': [
    <p><strong>Supreme HQ’s trainer lineup continues to lean on star performers,</strong> with Tara and Vivek holding 88-91% average capacity and 4.8/5 satisfaction while newer instructors Ishaan and Kavya sit at 72-75% utilization with 4.2/5 ratings. Strategic roster swaps in October lifted Ishaan’s occupancy by six points when paired with Tara’s curated playlists and Barre cueing framework.</p>,
    <p><strong>Member retention correlates with trainer consistency:</strong> cohorts attending at least two classes per week with the same instructor record 27% higher 30-day repeat bookings. Tara’s endurance Barre block converts 24% of trial guests to memberships, and Vivek’s evening Power Cycle averages 1.3 waitlisted members, signalling trainer-driven demand.</p>,
    <p><strong>Focus areas for November:</strong> extend Tara’s mentorship clinic to early-morning rotations to accelerate new-hire ramp, position Vivek in the Friday 1 PM slot to stabilize utilization above 70%, and launch post-class NPS micro-surveys for Ishaan and Kavya to surface priority coaching themes.</p>
  ],
  'patterns-trends-overview': [
    <p><strong>Supreme HQ Patterns & Trends Analysis:</strong> Member visit frequency at Supreme HQ shows strong weekday morning engagement with 65% of visits occurring between 7-10 AM, reflecting Bandra's professional demographic. Weekend attendance remains steady at 35% capacity, offering opportunity for targeted family/couples programs.</p>,
    <p><strong>Late cancellation frequency</strong> remains below network average at 7.2%, demonstrating member reliability. Monthly visit patterns show consistent 3.2 visits per member average, with high-frequency members (5+ visits/month) representing 18% of base but generating 42% of revenue.</p>
  ],
  'client-retention-overview': [
    <p><strong>Supreme HQ Client Retention Metrics:</strong> Average member lifetime of 8.2 months surpasses network average (6.5 months). Retention rate for 3-month+ members stands at 72%, while 1-month trial conversion remains at 45%, indicating opportunity for improved onboarding experiences.</p>,
    <p><strong>Churn analysis</strong> reveals highest risk period at month 2-3, requiring targeted mid-term engagement campaigns. High-value members (₹15K+ lifetime spend) show 85% retention rate, validating premium service positioning.</p>
  ],
  'class-formats-overview': [
    <p><strong>Supreme HQ Class Format Performance:</strong> Barre classes lead with 58% attendance share and 4.2/5 average satisfaction. Power Cycle maintains 42% share with strong evening demand. Hybrid format pilots show promising 15% premium pricing acceptance.</p>,
    <p><strong>Format-specific insights:</strong> Barre attracts 70% female demographic aged 25-40, while Power Cycle shows balanced gender split. Peak demand during 7-9 AM and 6-8 PM suggests capacity expansion opportunity for popular formats.</p>
  ],
  'funnel-leads-overview': [
    <p><strong>Supreme HQ Lead Conversion Funnel:</strong> Bandra location benefits from 28% higher trial sign-up rate vs network average, driven by premium positioning and convenient access. Trial-to-paid conversion at 52% exceeds target, with average 18-day decision cycle.</p>,
    <p><strong>Lead source analysis:</strong> Organic (walk-in) contributes 45%, Instagram ads 30%, referrals 25%. Cost per acquisition ₹850 vs ₹1,200 network average. Focus on referral program expansion can further reduce acquisition costs.</p>
  ],
  'late-cancellations-overview': [
    <p><strong>Supreme HQ Late Cancellation Analysis:</strong> Late cancellation rate of 7.2% outperforms network average (9.5%), saving approximately ₹45K monthly in lost capacity. Peak cancellation periods align with Monday mornings and Friday evenings.</p>,
    <p><strong>Behavioral patterns:</strong> Members with 5+ monthly visits show 80% lower cancellation rates. Implementing waitlist automation and 12-hour reminder system could further reduce cancellations by estimated 15-20%.</p>
  ],
  'class-attendance-overview': [
    <p><strong>Supreme HQ Class Attendance Metrics:</strong> Average class attendance of 12.3 members per session with peak capacity (18 members) reached during 7-8 AM and 7-8 PM slots. Utilization rate: 68% overall, with opportunity to boost off-peak (2-4 PM) attendance currently at 45%.</p>,
    <p><strong>Instructor performance:</strong> Top instructors maintain 95%+ capacity while newer instructors average 60%. Mentorship program and strategic scheduling can improve overall utilization by 10-15 percentage points.</p>
  ],
  'discounts-promotions-overview': [
    <p><strong>Supreme HQ Discount Strategy Analysis:</strong> Current discount rate of 7.2% (₹26.1K in September) remains manageable while supporting competitive positioning. Strategic seasonal promotions during Q4 slowdown can maintain volume without eroding premium brand perception.</p>,
    <p><strong>Promotion effectiveness:</strong> Friend referral discounts (₹1K off) drive highest LTV customers. Limited-time urgency campaigns show 35% conversion lift vs standard pricing. Recommendation: Cap discounts at 8% of revenue to protect margins while maintaining market competitiveness.</p>
  ],
  'expiration-analytics-overview': [
    <p><strong>Supreme HQ Package Expiration Patterns:</strong> Package utilization rate of 78% indicates healthy engagement, with members completing average 85% of purchased sessions. 30-day packages show best completion (92%) while 90-day packages lag at 65%, suggesting optimal package length.</p>,
    <p><strong>Renewal behavior:</strong> Proactive outreach 2 weeks before expiration increases renewal rate from 58% to 71%. Implementing automated renewal reminders with personalized recommendations can capture additional ₹2-3L quarterly revenue.</p>
  ],
  'sessions-overview': [
    <p><strong>Supreme HQ Sessions Analysis:</strong> Session scheduling efficiency at 85% with strong instructor performance across all formats. Member feedback scores average 4.3/5, with facility cleanliness (4.7/5) and instructor quality (4.5/5) driving satisfaction.</p>,
    <p><strong>Operational insights:</strong> Peak-hour waitlists indicate demand for additional 7-8 AM and 7-8 PM capacity. New instructor onboarding requires 8-week ramp to achieve target performance levels. Strategic hiring ahead of Q1 surge recommended.</p>
  ]
};

const curatedSummaries: Partial<Record<LocationKey, Partial<Record<SalesContextKey, React.ReactNode[]>>>> = {
  kwality: KWALITY_SUMMARY,
  supreme: SUPREME_SUMMARY
};

const locationSummariesCache: Partial<Record<LocationKey, Record<SalesContextKey, React.ReactNode[]>>> = {};

const normalizeLocationKey = (locationId?: string): LocationKey => {
  if (locationId === 'kwality') return 'kwality';
  if (locationId === 'supreme') return 'supreme';
  if (locationId === 'kenkere') return 'kenkere';
  return 'all';
};

const getLocationSummaryMap = (locationKey: LocationKey): Record<SalesContextKey, React.ReactNode[]> => {
  if (!generatedSummariesCache[locationKey]) {
    generatedSummariesCache[locationKey] = createLocationSummary(
      LOCATION_DISPLAY_NAMES[locationKey],
      locationKey === 'all' ? 'network' : 'studio'
    );
  }

  if (!locationSummariesCache[locationKey]) {
    const baseSummary = generatedSummariesCache[locationKey]!;
    const curated = curatedSummaries[locationKey];
    locationSummariesCache[locationKey] = curated ? { ...baseSummary, ...curated } : baseSummary;
  }

  return locationSummariesCache[locationKey]!;
};

export const InfoPopover: React.FC<InfoPopoverProps> = ({ context, locationId = 'all', className, size = 18, salesData, startOpen = false, startAsSidebar = true }) => {
  const locationKey = normalizeLocationKey(locationId);
  const isKwality = locationKey === 'kwality';
  const isSupreme = locationKey === 'supreme';
  const isKenkere = locationKey === 'kenkere';
  const isAll = locationKey === 'all';
  const locationName = LOCATION_DISPLAY_NAMES[locationKey];
  const locationSummaryMap = getLocationSummaryMap(locationKey);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  
  // New state for resize, pin, and customization features
  const [isPinned, setIsPinned] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalWidth, setModalWidth] = useState<number | null>(null);
  const [modalHeight, setModalHeight] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebar, setIsSidebar] = useState(startAsSidebar);
  const [isCompact, setIsCompact] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [open, setOpen] = useState(startOpen);
  const [showIntroHighlight, setShowIntroHighlight] = useState(true);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  // Sidebar sizing and resize state
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(420);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const sidebarStartRef = useRef({ x: 0, width: 420 });
  const suppressOpenRef = useRef(false);
  // Multi-view mode: 'summary' | 'raw' | 'json'
  const [viewMode, setViewMode] = useState<'summary' | 'raw' | 'json'>('summary');
  
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const timer = window.setTimeout(() => setShowIntroHighlight(false), 6500);
    return () => window.clearTimeout(timer);
  }, []);

  const closePopover = useCallback(() => {
    setIsPinned(false);
    setIsSidebar(false);
    setOpen(false);
    setShowIntroHighlight(false);
    suppressOpenRef.current = true;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        suppressOpenRef.current = false;
      }, 250);
    } else {
      suppressOpenRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closePopover();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, closePopover]);

  // Generate dynamic summary from sales data
  const dynamicSummary = useMemo(() => {
    console.log('useMemo - Generating dynamic summary:', {
      hasSalesData: !!salesData,
      salesDataLength: salesData?.length || 0,
      context,
      lastGenerated
    });
    
    if (!salesData || salesData.length === 0 || context !== 'sales-overview') {
      console.log('useMemo - Returning null (no data or wrong context)');
      return null;
    }

    try {
      const analysis = SalesAnalysisService.generateComparisonAnalysis(salesData);
      const summary = SalesAnalysisService.generateDetailedSummary(analysis);
      console.log('useMemo - Successfully generated summary:', {
        currentMonth: analysis.current.month,
        currentYear: analysis.current.year,
        currentRevenue: analysis.current.totalRevenue,
        previousMonth: analysis.previous.month,
        previousYear: analysis.previous.year,
        previousRevenue: analysis.previous.totalRevenue,
        revenueChange: analysis.revenueChangePercent
      });
      return { analysis, summary };
    } catch (error) {
      console.error('Error generating dynamic summary:', error);
      return null;
    }
  }, [salesData, context, lastGenerated]);

  // Determine which content to display
  let items: React.ReactNode[];
  
  // Debug logging
  console.log('InfoPopover - Content Selection:', {
    context,
    locationId,
    hasSalesData: !!salesData,
    salesDataLength: salesData?.length || 0,
    hasDynamicSummary: !!dynamicSummary,
    hasCustomContent: !!customContent,
    isKwality,
    isSupreme,
    isKenkere,
    isAll
  });
  
  if (context === 'sales-overview' && dynamicSummary && !customContent) {
    // Use dynamic summary
    console.log('Using DYNAMIC summary');
    items = [generateDynamicSummaryUI(dynamicSummary, locationId)];
  } else if (customContent) {
    // Use custom saved content
    console.log('Using CUSTOM content');
    items = [customContent];
  } else if (context === 'sales-overview' && isKwality) {
    console.log('Using KWALITY static summary');
    items = locationSummaryMap[context];
  } else if (context === 'sales-overview' && isSupreme) {
    console.log('Using SUPREME static summary');
    items = locationSummaryMap[context];
  } else if (context === 'sales-overview' && (isKenkere || isAll)) {
    // For Kenkere and All Locations, create custom overview
    items = [
      <div key={`${locationId}-oct-2025`} className="space-y-4">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-600 p-4 rounded-r-lg">
          <h4 className="font-bold text-slate-900 mb-2">📊 October 2025 Performance Summary</h4>
          <p className="text-sm text-slate-700">{isKenkere ? 'Kenkere House, Bengaluru' : 'All Studio Locations'}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span className="text-lg">📈</span> Performance Overview
          </h5>
          <p className="text-sm text-blue-900">
            {isKenkere
              ? 'Kenkere House maintained steady performance with focused membership growth and strong community engagement. The Bengaluru market continues to show resilience with growing class attendance and member retention.'
              : 'Combined performance across all locations shows strategic growth patterns with diversified revenue streams. Total network revenue demonstrates the strength of multi-location operations with cross-location member engagement.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-slate-900">{isKenkere ? '₹8.2L' : '₹39.0L'}</div>
            <div className="text-xs text-slate-600 mt-1">{isKenkere ? 'Steady growth' : 'Combined network'}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Transactions</div>
            <div className="text-2xl font-bold text-slate-900">{isKenkere ? '142' : '627'}</div>
            <div className="text-xs text-green-600 mt-1">Consistent activity</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Unique Members</div>
            <div className="text-2xl font-bold text-slate-900">{isKenkere ? '98' : '441'}</div>
            <div className="text-xs text-slate-600 mt-1">Active community</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Growth Potential</div>
            <div className="text-2xl font-bold text-slate-900">High</div>
            <div className="text-xs text-blue-600 mt-1">Market expansion</div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <h5 className="font-semibold text-slate-900 mb-3">Key Focus Areas</h5>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 font-bold">1</span>
              </div>
              <div className="flex-1">
                <h6 className="font-semibold text-slate-900 text-sm">Member Retention</h6>
                <p className="text-xs text-slate-600">Focus on maintaining high member engagement through personalized programming and community events</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 font-bold">2</span>
              </div>
              <div className="flex-1">
                <h6 className="font-semibold text-slate-900 text-sm">Revenue Diversification</h6>
                <p className="text-xs text-slate-600">Expand retail and private session offerings to create additional revenue streams</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-700 font-bold">3</span>
              </div>
              <div className="flex-1">
                <h6 className="font-semibold text-slate-900 text-sm">Seasonal Planning</h6>
                <p className="text-xs text-slate-600">Prepare Q4 strategies to counteract typical seasonal revenue fluctuations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <span className="text-lg">💡</span> Strategic Recommendations
          </h5>
          <ul className="text-sm text-green-900 space-y-2 list-disc list-inside">
            <li>Implement cross-location membership benefits to encourage network-wide engagement</li>
            <li>Launch targeted acquisition campaigns for new market segments</li>
            <li>Optimize pricing strategies based on location-specific market dynamics</li>
            <li>Develop referral programs to leverage existing member base for growth</li>
          </ul>
        </div>
      </div>
    ];
  } else {
    const fallbackItems = locationSummaryMap[context] ?? getLocationSummaryMap('all')[context];
    items = fallbackItems ?? [];
  }

  // Load custom content from Google Drive on mount
  useEffect(() => {
    loadCustomContent();
  }, [context, locationId]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (open && !isPinned) {
        handleRefresh();
      }
    }, 60_000); // every 60s
    return () => clearInterval(id);
  }, [autoRefresh, open, isPinned]);

  // Sidebar resize handlers
  useEffect(() => {
    if (!isResizingSidebar) return;
    const onMouseMove = (e: MouseEvent) => {
      const delta = sidebarStartRef.current.x - e.clientX;
      const newWidth = Math.max(300, Math.min(900, sidebarStartRef.current.width + delta));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => setIsResizingSidebar(false);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizingSidebar]);

  // When sidebar is open, optionally push the page content to the left so the sidebar doesn't overlap.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const shouldPush = isSidebar && open && window.innerWidth > 900; // only push on wide screens
    const prevPadding = document.body.style.paddingRight || '';
    const prevTransition = document.body.style.transition || '';
    if (shouldPush) {
      document.body.style.transition = 'padding-right 200ms ease';
      document.body.style.paddingRight = `${sidebarWidth || 420}px`;
    } else {
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.paddingRight = prevPadding;
      document.body.style.transition = prevTransition;
    };
  }, [isSidebar, open, sidebarWidth]);

  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingSidebar(true);
    sidebarStartRef.current = { x: e.clientX, width: sidebarWidth || 420 };
  };

  // Helper function to render HTML (handles both complete documents and snippets)
  const renderHtmlContent = (html: string) => {
    if (typeof window === 'undefined') {
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }

    // Check if this is a complete HTML document
    const trimmedHtml = html.trim();
    const isCompleteDocument = trimmedHtml.toLowerCase().startsWith('<!doctype html>') || 
                               trimmedHtml.toLowerCase().startsWith('<html');
    
    if (isCompleteDocument) {
      // Parse the complete HTML document
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract styles from <head>
      const styleElements = doc.querySelectorAll('head style');
      const styles = Array.from(styleElements).map(style => style.textContent).join('\n');
      
      // Extract body content
      const bodyContent = doc.body?.innerHTML || '';
      
      // Sanitize the body content
      const safeBodyHtml = DOMPurify.sanitize(bodyContent);
      
      return (
        <>
          {styles && <style dangerouslySetInnerHTML={{ __html: styles }} />}
          <div dangerouslySetInnerHTML={{ __html: safeBodyHtml }} />
        </>
      );
    }
    
    // Regular HTML snippet (not a complete document)
    const safeHtml = DOMPurify.sanitize(html);
    return (
      <div className="prose prose-slate prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: safeHtml }} />
    );
  };

  // Render content based on view mode
  const renderContentByMode = (nodes: React.ReactNode[]) => {
    if (viewMode === 'raw') {
      return (
        <pre className="whitespace-pre-wrap text-xs text-slate-700">{convertItemsToString()}</pre>
      );
    }
    if (viewMode === 'json') {
      const json = dynamicSummary ? JSON.stringify(dynamicSummary, null, 2) : JSON.stringify(items, null, 2);
      return <pre className="whitespace-pre-wrap text-xs text-slate-700">{json}</pre>;
    }
    // default: summary
    // If content is plain HTML string(s), render as HTML
    const allStrings = nodes.every((n) => typeof n === 'string');
    if (allStrings) {
      const html = nodes.join('\n\n');
      return <div className="space-y-2.5">{renderHtmlContent(html)}</div>;
    }

    return (
      <div className="space-y-2.5">
        {nodes.map((node, idx) => (
          <div key={idx}>
            <div className="flex gap-2.5 p-3 rounded-lg bg-slate-50/80 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
              <div className="text-slate-700 text-sm leading-relaxed flex-1 prose prose-slate prose-sm prose-p:my-1 prose-p:leading-relaxed prose-strong:text-slate-900 prose-strong:font-semibold prose-ul:my-1 prose-li:my-0.5">
                {node}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const loadCustomContent = async () => {
    setIsLoading(true);
    try {
      const savedContent = await googleDriveService.getPopoverContent(context, locationId);
      setCustomContent(savedContent);
    } catch (error) {
      console.error('Error loading custom content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const convertItemsToString = () => {
    return items.map((item) => {
      if (typeof item === 'string') return item;
      if (React.isValidElement(item)) {
        const extractText = (node: any): string => {
          if (typeof node === 'string') return node;
          if (Array.isArray(node)) return node.map(extractText).join('');
          if (React.isValidElement(node) && (node.props as any).children) {
            return extractText((node.props as any).children);
          }
          return '';
        };
        return extractText(item);
      }
      return '';
    }).join('\n\n');
  };

  const handleEdit = () => {
    setEditContent(customContent || convertItemsToString());
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sanitize content before saving to remote store
      const sanitized = typeof window !== 'undefined' ? DOMPurify.sanitize(editContent) : editContent;
      const success = await googleDriveService.updatePopoverContent(context, locationId, sanitized);
      
      if (success) {
        setCustomContent(sanitized);
        setIsEditing(false);
        toast({
          title: "Content saved",
          description: "Your changes have been saved to Google Drive.",
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error saving content",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleRestore = async () => {
    if (!confirm('Are you sure you want to restore the default content?')) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await googleDriveService.deletePopoverContent(context, locationId);
      
      if (success) {
        setCustomContent(null);
        setIsEditing(false);
        toast({
          title: "Content restored",
          description: "Default content has been restored.",
        });
      } else {
        throw new Error('Failed to restore');
      }
    } catch (error) {
      console.error('Error restoring content:', error);
      toast({
        title: "Error restoring content",
        description: "Failed to restore default content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = () => {
    setIsGenerating(true);
    try {
      // Force useMemo to recalculate by updating timestamp
      setLastGenerated(new Date().toISOString());
      toast({
        title: "Analysis refreshed",
        description: "Dynamic summary has been regenerated with latest data.",
      });
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      toast({
        title: "Error refreshing",
        description: "Failed to regenerate analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle pin state
  const handleTogglePin = () => {
    setIsPinned(!isPinned);
    toast({
      title: isPinned ? "Unpinned" : "Pinned",
      description: isPinned ? "Modal will close when clicking outside" : "Modal will stay open",
    });
  };

  // Toggle expanded state
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setModalWidth(null);
      setModalHeight(null);
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const rect = resizeRef.current?.getBoundingClientRect();
    if (rect) {
      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      };
    }
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      
      const newWidth = Math.max(400, Math.min(1200, startPosRef.current.width + deltaX));
      const newHeight = Math.max(300, Math.min(900, startPosRef.current.height + deltaY));
      
      setModalWidth(newWidth);
      setModalHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Calculate modal dimensions
  const getModalStyle = () => {
    if (isExpanded) {
      return { 
        width: '95vw', 
        maxWidth: '1400px',
        maxHeight: 'calc(95vh - 100px)' 
      };
    }
    if (modalWidth && modalHeight) {
      return { 
        width: `${modalWidth}px`, 
        height: `${modalHeight}px`,
        maxHeight: `${modalHeight}px`
      };
    }
    return {};
  };

  // Header controls shared between modal header and sidebar header
  const headerControls = (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleTogglePin}
        className={`h-7 w-7 p-0 ${isPinned ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
        title={isPinned ? "Unpin (allow closing)" : "Pin (keep open)"}
      >
        {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={handleToggleExpand}
        className={`h-7 w-7 p-0 ${isExpanded ? 'text-purple-600 bg-purple-50' : 'text-slate-600'}`}
        title={isExpanded ? "Collapse" : "Expand"}
      >
        {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </Button>

      {dynamicSummary && !customContent && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={isGenerating}
          className="gap-1.5 h-7 px-2.5 text-xs"
          title="Refresh analysis"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
        </Button>
      )}

      {customContent && (
        <span className="text-xs text-green-600 font-medium flex items-center gap-1 px-2 py-1 bg-green-50 rounded">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Custom
        </span>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(convertItemsToString());
            toast({ title: 'Copied', description: 'Summary copied to clipboard.' });
          } catch (err) {
            toast({ title: 'Copy failed', description: 'Unable to copy to clipboard.', variant: 'destructive' });
          }
        }}
        title="Copy summary"
        className="h-7 w-7 p-0"
      >
        <Copy className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          try {
            let rawHtml = '';
            if (customContent) {
              rawHtml = customContent;
            } else {
              const allStrings = items.every((n) => typeof n === 'string');
              if (allStrings) {
                rawHtml = items.join('\n\n');
              } else {
                rawHtml = convertItemsToString().replace(/\n/g, '<br/>');
              }
            }
            const safeHtml = typeof window !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
            const html = `<!doctype html><meta charset="utf-8"><title>Summary</title><body>${safeHtml}</body>`;
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${context}-${locationId || 'all'}-summary.html`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast({ title: 'Exported', description: 'Summary exported as HTML.' });
          } catch (err) {
            console.error('Export failed', err);
            toast({ title: 'Export failed', description: 'Unable to export summary.', variant: 'destructive' });
          }
        }}
        title="Export HTML"
        className="h-7 w-7 p-0"
      >
        <Download className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={async () => {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('popoverContext', context);
            url.searchParams.set('popoverLocation', locationId);
            if (lastGenerated) url.searchParams.set('generatedAt', lastGenerated);
            await navigator.clipboard.writeText(url.toString());
            toast({ title: 'Link copied', description: 'Shareable link copied to clipboard.' });
          } catch (err) {
            toast({ title: 'Share failed', description: 'Unable to create share link.', variant: 'destructive' });
          }
        }}
        title="Copy share link"
        className="h-7 w-7 p-0"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="sm"
        variant={isCompact ? 'secondary' : 'ghost'}
        onClick={() => setIsCompact(!isCompact)}
        title="Toggle compact mode"
        className="h-7 w-7 p-0"
      >
        <Minimize2 className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="sm"
        variant={autoRefresh ? 'secondary' : 'ghost'}
        onClick={() => setAutoRefresh(!autoRefresh)}
        title="Toggle auto-refresh (60s)"
        className="h-7 w-7 p-0"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
      </Button>

      {/* Sidebar toggle button is included here as well */}
      <Button
        size="sm"
        variant={isSidebar ? 'secondary' : 'ghost'}
        onClick={() => {
          if (isSidebar) {
            setIsSidebar(false);
            setOpen(false);
          } else {
            setIsSidebar(true);
            setOpen(true);
          }
        }}
        title={isSidebar ? 'Close sidebar' : 'Open as sidebar'}
        className="h-7 w-7 p-0"
      >
        <Info className="w-3.5 h-3.5" />
      </Button>
    </div>
  );

  // When opening via the trigger, default to sidebar mode (unless pinned) so the popover does not overlap
  const handleOpenChange = (v: boolean) => {
    // Prevent rapid re-open after a user-initiated close (suppressOpenRef).
    if (v && suppressOpenRef.current) {
      // ignore open
      suppressOpenRef.current = false;
      return;
    }
    // Keep open + sidebar state in sync: opening opens the sidebar by default,
    // closing will close both the sidebar and the popover so we don't flip to modal.
    setOpen(v);
    setIsSidebar(v);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={!isPinned}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show summary"
          className={`${className ?? ''} inline-flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 p-1 shadow-sm hover:shadow transition relative`}
          onClick={() => setShowIntroHighlight(false)}
        >
          {showIntroHighlight && (
            <span className="info-popover-callout absolute top-1/2 left-full ml-2 px-3 py-2 rounded-lg bg-indigo-600 text-white shadow-xl border border-white/20 text-[10px] font-semibold tracking-[0.12em] uppercase flex items-center gap-1">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">i</span>
              View summary
              <span className="absolute top-1/2 -left-1.5 h-3 w-3 bg-indigo-600 rotate-45 -translate-y-1/2 border-l border-b border-white/20 pointer-events-none"></span>
            </span>
          )}
          <span className={`flex items-center justify-center ${showIntroHighlight ? 'info-popover-highlight' : ''}`}>
          <Info width={size} height={size} />
          </span>
          {customContent && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          )}
          {isPinned && (
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </PopoverTrigger>
      {/* Render modal popover only when not in sidebar mode to avoid double rendering/overlap */}
      {!isSidebar && (
        <PopoverContent
          ref={resizeRef}
          align="end"
          side="bottom"
          sideOffset={12}
          alignOffset={0}
          avoidCollisions={true}
          collisionPadding={{ top: 120, bottom: 24, left: 24, right: 24 }}
          className={`z-[9999] bg-white border border-slate-200 shadow-2xl rounded-xl p-0 overflow-hidden relative ${isCompact ? 'text-sm p-0' : ''}`}
          style={{
            ...getModalStyle(),
            ...(isExpanded || (modalWidth && modalHeight) ? {} : {
              width: 'clamp(360px, 92vw, 850px)',
              maxWidth: '850px'
            })
          }}
        >
          {open && typeof document !== 'undefined' && createPortal(
            <div
              onClick={closePopover}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9990 }}
              aria-hidden
            />,
            document.body
          )}

          <div
            className="flex flex-col h-full"
            style={{ maxHeight: modalHeight ? `${modalHeight}px` : isExpanded ? 'calc(95vh - 100px)' : 'min(85vh, 700px)' }}
          >
            {/* Header - Fixed */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white" style={{ zIndex: 20 }}>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">
                    {context.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 mt-0.5">
                    {locationName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Pin Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTogglePin}
                  className={`h-7 w-7 p-0 ${isPinned ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                  title={isPinned ? "Unpin (allow closing)" : "Pin (keep open)"}
                >
                  {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                </Button>

                {/* Expand/Collapse Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleExpand}
                  className={`h-7 w-7 p-0 ${isExpanded ? 'text-purple-600 bg-purple-50' : 'text-slate-600'}`}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </Button>

                {/* Refresh Button */}
                {dynamicSummary && !customContent && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefresh}
                    disabled={isGenerating}
                    className="gap-1.5 h-7 px-2.5 text-xs"
                    title="Refresh analysis"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  </Button>
                )}

                {/* Custom Indicator */}
                {customContent && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1 px-2 py-1 bg-green-50 rounded">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Custom
                  </span>
                )}
                {/* Extra Features: Copy / Export / Share / Compact / Sidebar Toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(convertItemsToString());
                      toast({ title: 'Copied', description: 'Summary copied to clipboard.' });
                    } catch (err) {
                      toast({ title: 'Copy failed', description: 'Unable to copy to clipboard.', variant: 'destructive' });
                    }
                  }}
                  title="Copy summary"
                  className="h-7 w-7 p-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    try {
                      // Build raw HTML from customContent (preferred) or items/text fallback
                      let rawHtml = '';
                      if (customContent) {
                        rawHtml = customContent;
                      } else {
                        const allStrings = items.every((n) => typeof n === 'string');
                        if (allStrings) {
                          rawHtml = items.join('\n\n');
                        } else {
                          rawHtml = convertItemsToString().replace(/\n/g, '<br/>');
                        }
                      }

                      // Sanitize before exporting
                      const safeHtml = typeof window !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
                      const html = `<!doctype html><meta charset="utf-8"><title>Summary</title><body>${safeHtml}</body>`;
                      const blob = new Blob([html], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${context}-${locationId || 'all'}-summary.html`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      toast({ title: 'Exported', description: 'Summary exported as HTML.' });
                    } catch (err) {
                      console.error('Export failed', err);
                      toast({ title: 'Export failed', description: 'Unable to export summary.', variant: 'destructive' });
                    }
                  }}
                  title="Export HTML"
                  className="h-7 w-7 p-0"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      const url = new URL(window.location.href);
                      url.searchParams.set('popoverContext', context);
                      url.searchParams.set('popoverLocation', locationId);
                      if (lastGenerated) url.searchParams.set('generatedAt', lastGenerated);
                      await navigator.clipboard.writeText(url.toString());
                      toast({ title: 'Link copied', description: 'Shareable link copied to clipboard.' });
                    } catch (err) {
                      toast({ title: 'Share failed', description: 'Unable to create share link.', variant: 'destructive' });
                    }
                  }}
                  title="Copy share link"
                  className="h-7 w-7 p-0"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant={isCompact ? 'secondary' : 'ghost'}
                  onClick={() => setIsCompact(!isCompact)}
                  title="Toggle compact mode"
                  className="h-7 w-7 p-0"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant={autoRefresh ? 'secondary' : 'ghost'}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  title="Toggle auto-refresh (60s)"
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
                </Button>

                <Button
                  size="sm"
                  variant={isSidebar ? 'secondary' : 'ghost'}
                  onClick={() => {
                    if (isSidebar) {
                      closePopover();
                    } else {
                      setIsSidebar(true);
                      setOpen(true);
                    }
                  }}
                  title={isSidebar ? 'Close sidebar' : 'Open as sidebar'}
                  className="h-7 w-7 p-0"
                >
                  <Info className="w-3.5 h-3.5" />
                </Button>
                {/* View mode selector */}
                <div className="hidden md:flex items-center gap-1 ml-2">
                  <button
                    onClick={() => setViewMode('summary')}
                    className={`px-2 py-1 rounded text-xs ${viewMode === 'summary' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Summary view"
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-2 py-1 rounded text-xs ${viewMode === 'raw' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Raw text"
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setViewMode('json')}
                    className={`px-2 py-1 rounded text-xs ${viewMode === 'json' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="JSON view"
                  >
                    JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div
              className="flex-1 overflow-y-auto px-5 py-4"
              style={{
                minHeight: 0,
                maxHeight: modalHeight ? `${modalHeight - 60}px` : isExpanded ? 'calc(95vh - 160px)' : 'min(calc(85vh - 100px), 640px)'
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-indigo-600" />
                      Edit Content (HTML Supported)
                    </label>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[260px] font-mono text-xs border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg resize-none"
                      placeholder="Enter popover content here (supports HTML)..."
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
                    <div className="flex gap-2 flex-1">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2 flex-1 bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                    {customContent && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleRestore}
                        disabled={isSaving}
                        className="gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ) : customContent ? (
                <div className="space-y-3">
                  {renderHtmlContent(customContent)}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEdit}
                      className="gap-1.5 flex-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRestore}
                      className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Restore
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {renderContentByMode(items)}

                  {!isEditing && !customContent && (
                    <div className="pt-3 border-t border-slate-200 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEdit}
                        className="gap-1.5 flex-1 hover:bg-indigo-50 hover:border-indigo-300"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Customize Content
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsSidebar(false);
                          setOpen(true);
                        }}
                        className="gap-1.5 hover:bg-blue-50 hover:border-blue-300"
                        title="Open as popout modal"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        Pop Out
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resize Handle */}
            {!isExpanded && (
              <div
                onMouseDown={handleResizeStart}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize group"
                title="Drag to resize"
              >
                <GripHorizontal
                  className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 rotate-45 absolute bottom-0.5 right-0.5"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      )}
      {/* Sidebar portal: renders independent right-side panel when toggled */}
      {isSidebar && open && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed top-0 right-0 bg-white shadow-2xl z-[9999] ${isCompact ? 'text-sm' : ''}`}
          style={{ width: sidebarWidth ? `${sidebarWidth}px` : 420, maxWidth: '95vw', height: '100vh', display: 'flex', flexDirection: 'column' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Info className="w-4 h-4 text-white" /></div>
              <div>
                <div className="font-semibold">{context.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
                <div className="text-xs text-slate-500">{locationName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {headerControls}
              <Button size="sm" variant="ghost" onClick={closePopover}><X className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
          <div
            ref={sidebarRef}
            className="flex-1 min-h-0 flex flex-col"
            style={{ overflow: 'hidden' }}
          >
            <div className="p-4 shrink-0">
              {/* small note area kept in header region inside sidebar */}
            </div>
            <div className="flex-1 overflow-auto p-4" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
              ) : isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-indigo-600" />
                      Edit Content (HTML Supported)
                    </label>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[260px] font-mono text-xs border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg resize-none"
                      placeholder="Enter popover content here (supports HTML)..."
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
                    <div className="flex gap-2 flex-1">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2 flex-1 bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                    {customContent && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleRestore}
                        disabled={isSaving}
                        className="gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ) : customContent ? (
                <div className="space-y-3">
                  {renderHtmlContent(customContent)}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEdit}
                      className="gap-1.5 flex-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRestore}
                      className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Restore
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {renderContentByMode(items)}
                  {!isEditing && !customContent && (
                    <div className="pt-3 border-t border-slate-200 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEdit}
                        className="gap-1.5 flex-1 hover:bg-indigo-50 hover:border-indigo-300"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Customize Content
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Open as modal (close sidebar, open popover as modal)
                          setIsSidebar(false);
                          setOpen(true);
                        }}
                        className="gap-1.5 hover:bg-blue-50 hover:border-blue-300"
                        title="Open as popout modal"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        Pop Out
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Resize handle (left edge) - visible indicator for easy grab */}
            <div
              onMouseDown={handleSidebarResizeStart}
              className="absolute left-0 top-0 h-full w-3 cursor-ew-resize bg-gradient-to-r from-slate-200 to-transparent hover:from-blue-400 hover:to-transparent opacity-50 hover:opacity-100 transition-opacity"
              aria-hidden
              title="Drag to resize sidebar"
            />
          </div>
        </div>,
        document.body
      )}
    </Popover>
  );
};

export default InfoPopover;
