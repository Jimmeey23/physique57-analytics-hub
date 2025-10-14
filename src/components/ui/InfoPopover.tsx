import React from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  | 'sales-overview';

interface InfoPopoverProps {
  context: SalesContextKey;
  locationId?: 'kwality' | 'supreme' | 'kenkere' | 'all' | string;
  className?: string;
  size?: number;
}

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
    // Full location overview rendered via rich layout below
  ]
};

const GENERIC_SUMMARY: Record<SalesContextKey, React.ReactNode[]> = {
  'sales-metrics': ['Summary unavailable for this location. Switch to Kwality to view curated insights.'],
  'sales-top-bottom': ['Summary unavailable for this location.'],
  'sales-mom': ['Summary unavailable for this location.'],
  'sales-yoy': ['Summary unavailable for this location.'],
  'sales-product': ['Summary unavailable for this location.'],
  'sales-category': ['Summary unavailable for this location.'],
  'sales-soldby': ['Summary unavailable for this location.'],
  'sales-payment': ['Summary unavailable for this location.'],
  'sales-customer': ['Summary unavailable for this location.'],
  'sales-deep-insights': ['Summary unavailable for this location.']
  , 'sales-overview': ['Summary unavailable for this location.']
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
    // Full location overview rendered via rich layout below
  ]
};

export const InfoPopover: React.FC<InfoPopoverProps> = ({ context, locationId = 'all', className, size = 18 }) => {
  const isKwality = locationId === 'kwality';
  const isSupreme = locationId === 'supreme';
  const items = isKwality
    ? KWALITY_SUMMARY[context]
    : isSupreme
    ? SUPREME_SUMMARY[context]
    : GENERIC_SUMMARY[context];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show summary"
          className={
            `${className ?? ''} inline-flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 p-1 shadow-sm hover:shadow transition`
          }
        >
          <Info width={size} height={size} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        sideOffset={24}
        avoidCollisions={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        collisionPadding={{ top: 80, bottom: 24, left: 16, right: 16 }}
        style={{ maxHeight: 'calc(100dvh - 128px)' }}
        className="z-[9999] w-[36rem] min-w-[20rem] max-w-[95vw] overflow-auto overscroll-contain px-4 pb-4 pt-12 md:px-6 md:pb-6 md:pt-14 text-sm space-y-4 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-slate-200 shadow-2xl rounded-xl ring-1 ring-slate-200 focus:outline-none resize prose prose-slate prose-sm prose-headings:text-slate-900 prose-h2:text-xl prose-h3:text-lg prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:marker:text-slate-400"
      >
        {context === 'sales-overview' && isSupreme && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Supreme HQ Performance Overview: September 2025</h2>
            <div>
              <h3 className="font-semibold text-slate-900">Executive Summary</h3>
              <p className="mt-2 text-slate-700">September 2025 showed <strong>mixed performance</strong> for Supreme HQ, with total revenue of <strong>₹15.7L</strong>, which represents a <strong>16% decrease from July 2025 (₹18.7L)</strong> but a <strong>3.3% increase from June 2025 (₹15.2L)</strong>. While the overall number of transactions decreased compared to previous months, the <strong>average transaction value increased</strong>, indicating a shift toward higher-priced items. This analysis compares September 2025 with July, June, and May 2025 to provide accurate insights, <strong>excluding August 2025 as an anomalous period</strong>.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Detailed Performance Analysis</h3>
              <h4 className="mt-2 font-semibold text-slate-900">Overall Revenue Performance</h4>
              <ul className="mt-1 list-disc pl-5 text-slate-700 space-y-1">
                <li><strong>September 2025:</strong> ₹15.7L</li>
                <li><strong>July 2025:</strong> ₹18.7L (<strong>-16%</strong> from September)</li>
                <li><strong>June 2025:</strong> ₹15.2L (<strong>+3.3%</strong> from September)</li>
                <li><strong>May 2025:</strong> ₹17.9L (<strong>-12.3%</strong> from September)</li>
              </ul>
              <h4 className="mt-3 font-semibold text-slate-900">Transaction Volume vs. Value Analysis</h4>
              <p className="mt-1 text-slate-700">September 2025 saw a significant decrease in <strong>total transactions (225)</strong> compared to July (286), June (339), and May (277). However, the <strong>average transaction value increased to ₹7.8K</strong>, higher than July (₹7.1K), June (₹5.5K), and May (₹6.8K).</p>
              <h4 className="mt-3 font-semibold text-slate-900">Category Performance Breakdown</h4>
              <div className="mt-2 space-y-3">
                <div>
                  <h5 className="font-semibold">1. Memberships (Primary Revenue Driver)</h5>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Revenue:</strong> ₹7.6L (Sep) vs ₹10.7L (Jul), ₹8.5L (Jun), ₹8.2L (May)</li>
                    <li><strong>Units Sold:</strong> 36 (Sep) vs 44 (Jul), 30 (Jun), 32 (May)</li>
                    <li><strong>Average Price:</strong> ₹21.0K (Sep) vs ₹24.3K (Jul), ₹28.3K (Jun), ₹25.5K (May)</li>
                  </ul>
                  <p className="mt-1 text-slate-700"><strong>Insights:</strong> Membership revenue decreased 29% from July but remained relatively stable vs June/May. Decrease in both units and average price suggests <strong>pricing sensitivity or saturation</strong>. Studio 1 Month Unlimited led (27 units), followed by Studio 3 Month Unlimited (4 units).</p>
                </div>
                <div>
                  <h5 className="font-semibold">2. Class Packages</h5>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Revenue:</strong> ₹6.0L (Sep) vs ₹4.9L (Jul), ₹3.5L (Jun), ₹6.2L (May)</li>
                    <li><strong>Units Sold:</strong> 41 (Sep) vs 34 (Jul), 28 (Jun), 40 (May)</li>
                    <li><strong>Average Price:</strong> ₹14.9K (Sep) vs ₹14.4K (Jul), ₹13.9K (Jun), ₹16.7K (May)</li>
                  </ul>
                  <p className="mt-1 text-slate-700"><strong>Insights:</strong> Strong performance with <strong>+22.4% revenue vs July</strong>. More units than July/June; average price below May. Studio 12 Class Package led (12 units); Studio 10 Class Package improved (11 units, from 0 in July).</p>
                </div>
                <div>
                  <h5 className="font-semibold">3. Sessions/Single Classes</h5>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Revenue:</strong> ₹1.2L (Sep) vs ₹2.2L (Jul), ₹1.8L (Jun), ₹1.9L (May)</li>
                    <li><strong>Units Sold:</strong> 63 (Sep) vs 122 (Jul), 90 (Jun), 103 (May)</li>
                    <li><strong>Average Price:</strong> ₹2.0K (Sep) vs ₹1.9K (Jul), ₹2.0K (Jun), ₹1.9K (May)</li>
                  </ul>
                  <p className="mt-1 text-slate-700"><strong>Insights:</strong> Largest decline: revenue down <strong>45.5%</strong> vs July; units nearly halved → reduced engagement in single classes. Class Name sessions outperformed Studio Single Classes (30 vs 33 units).</p>
                </div>
                <div>
                  <h5 className="font-semibold">4. Newcomers Special</h5>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Revenue:</strong> ₹39.6K (Sep) vs ₹42.5K (Jul), ₹58.4K (Jun), ₹97.3K (May)</li>
                    <li><strong>Units Sold:</strong> 24 (Sep) vs 24 (Jul), 33 (Jun), 55 (May)</li>
                    <li><strong>Average Price:</strong> ₹1.6K (Sep) vs ₹1.8K (Jul/Jun/May)</li>
                  </ul>
                  <p className="mt-1 text-slate-700"><strong>Insights:</strong> Newcomer acquisition declining since May; unit sales stable vs July but revenue down due to lower price → <strong>promo effectiveness concern</strong>.</p>
                </div>
                <div>
                  <h5 className="font-semibold">5. Retail</h5>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Revenue:</strong> ₹54.5K (Sep) vs ₹42.2K (Jul), ₹60.8K (Jun), ₹50.2K (May)</li>
                    <li><strong>Units Sold:</strong> 53 (Sep) vs 59 (Jul), 146 (Jun), 41 (May)</li>
                    <li><strong>Average Price:</strong> ₹1.7K (Sep) vs ₹1.0K (Jul), ₹668 (Jun), ₹1.5K (May)</li>
                  </ul>
                  <p className="mt-1 text-slate-700"><strong>Insights:</strong> Mixed: higher revenue than July/May but below June. Fewer units vs July but higher revenue due to <strong>higher average price</strong> → shift toward higher-margin retail.</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Key Patterns and Trends</h3>
              <ol className="mt-2 list-decimal pl-5 text-slate-700 space-y-1">
                <li><strong>Premiumization Trend:</strong> Lower volume, higher value across categories.</li>
                <li><strong>Membership Dependency:</strong> Primary driver (48.4% of revenue) but showing vulnerability.</li>
                <li><strong>Package Preference:</strong> Increased interest in Studio 12 and 10 Class Packages.</li>
                <li><strong>New Customer Challenge:</strong> Decline in Newcomers Special → acquisition headwinds.</li>
                <li><strong>Seasonal Patterns:</strong> September is transitional between summer and late spring levels.</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Strategic Recommendations</h3>
              <h4 className="mt-2 font-semibold">1. Membership Retention & Acquisition Strategy</h4>
              <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                <li>Membership renewal campaign with early incentives</li>
                <li>Tiered membership options for price sensitivity</li>
                <li>Referral program leveraging existing members</li>
                <li>Limited-time promos on Studio 1 Month Unlimited to boost volume</li>
              </ul>
              <h4 className="mt-3 font-semibold">2. Class Package Optimization</h4>
              <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                <li>Promote Studio 12 Class Package with targeted offers</li>
                <li>Bundle packages with complementary services</li>
                <li>Introduce seasonal package variants</li>
                <li>Build upgrade path from shorter to longer duration</li>
              </ul>
              <h4 className="mt-3 font-semibold">3. Single Class Revitalization</h4>
              <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                <li>Analyze drop; introduce themed/specialty classes</li>
                <li>Flexible booking options</li>
                <li>Promos targeting lapsed package members</li>
              </ul>
              <h4 className="mt-3 font-semibold">4. Newcomer Acquisition Enhancement</h4>
              <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                <li>Redesign newcomers offering to boost value</li>
                <li>Targeted digital campaigns for first-timers</li>
                <li>Local partnerships/influencers</li>
                <li>Onboarding experience to convert to memberships</li>
              </ul>
              <h4 className="mt-3 font-semibold">5. Retail Strategy Refinement</h4>
              <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                <li>Expand premium retail offerings</li>
                <li>Create retail bundles that complement packages</li>
                <li>Loyalty program for retail purchases</li>
                <li>Prioritize highest-margin products in promotion</li>
              </ul>
              <h4 className="mt-3 font-semibold">6. Data-Driven Decision Making</h4>
              <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                <li>Customer segmentation for purchase patterns</li>
                <li>Track newcomer → regular conversion</li>
                <li>Predictive analytics for churn risk</li>
                <li>Dashboard to monitor KPIs in real-time</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Conclusion</h3>
              <p className="mt-2 text-slate-700">September 2025 presented a <strong>mixed performance</strong> for Supreme HQ: challenges in volume but <strong>opportunities in higher-value sales</strong>. Balance premiumization with strategies to <strong>increase engagement and acquisition</strong>. The move away from the anomalous August suggests a return to normal patterns; <strong>continued monitoring</strong> and <strong>targeted adjustments</strong> are essential for sustained growth and profitability.</p>
            </div>
          </div>
        )}
        {context === 'sales-overview' && isKwality && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Kwality House, Kemps Corner: Performance Overview - September 2025</h2>
            <div>
              <h3 className="font-semibold text-slate-900">Executive Summary</h3>
              <p className="mt-2 text-slate-700">September 2025 was an <strong>outstanding month</strong> for Kwality House, with robust growth across key metrics <strong>without heavy discounting</strong>. Total revenue surged by <strong>31%</strong> vs May–July 2025 average, driven by a large influx of new members and <strong>diversified revenue</strong>. High-margin Privates and <strong>exceptional newcomer acquisition</strong> highlight a highly effective strategy.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">1. Overall Performance (Sep 2025 vs May–Jul 2025 Avg)</h3>
              <table className="w-full text-left text-slate-700 mt-2 border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 border-b border-slate-200">Metric</th>
                    <th className="p-2 border-b border-slate-200">September 2025</th>
                    <th className="p-2 border-b border-slate-200">May–July Avg</th>
                    <th className="p-2 border-b border-slate-200">Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border-b border-slate-100 font-medium">Total Revenue</td>
                    <td className="p-2 border-b border-slate-100">₹25.2L</td>
                    <td className="p-2 border-b border-slate-100">₹19.23L</td>
                    <td className="p-2 border-b border-slate-100 text-green-700">↑ +31%</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-b border-slate-100 font-medium">Total Units Sold</td>
                    <td className="p-2 border-b border-slate-100">351</td>
                    <td className="p-2 border-b border-slate-100">293</td>
                    <td className="p-2 border-b border-slate-100 text-green-700">↑ +20%</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-b border-slate-100 font-medium">Unique Members</td>
                    <td className="p-2 border-b border-slate-100">248</td>
                    <td className="p-2 border-b border-slate-100">173</td>
                    <td className="p-2 border-b border-slate-100 text-green-700">↑ +43%</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-b border-slate-100 font-medium">Avg. Transaction Value (ATV)</td>
                    <td className="p-2 border-b border-slate-100">₹7.6K</td>
                    <td className="p-2 border-b border-slate-100">₹7.8K</td>
                    <td className="p-2 border-b border-slate-100 text-amber-600">↓ -3% (Stable)</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-b border-slate-100 font-medium">Total Discount Amount</td>
                    <td className="p-2 border-b border-slate-100">₹1.9L</td>
                    <td className="p-2 border-b border-slate-100">₹3.47L</td>
                    <td className="p-2 border-b border-slate-100 text-green-700">↓ -45%</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-slate-700"><strong>Key Takeaway:</strong> Growth was driven by <strong>+43% unique members</strong> and <strong>+20% units</strong> while <strong>reducing discounts</strong>—indicating organic, demand‑driven strength.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">2. Category Performance Deep Dive</h3>
              <div className="mt-2 space-y-3">
                <div>
                  <h4 className="font-semibold">A. Memberships: The Stable Bedrock</h4>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Sep Revenue:</strong> ₹11.3L; <strong>Baseline:</strong> ₹9.7L → <strong>+16%</strong></li>
                    <li><strong>Highlights:</strong> 1 Month Unlimited ₹2.8L (15 units); 3 Month Unlimited ₹1.5L (3 units); preference for shorter terms.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">B. Class Packages: Consistent Performer</h4>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Sep Revenue:</strong> ₹6.7L; <strong>Baseline:</strong> ₹6.6L → <strong>+2%</strong></li>
                    <li><strong>Leader:</strong> Studio 12 Class Package ₹3.4L (21 units); 8‑Class also strong.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">C. Sessions/Single Classes: Breakout Star</h4>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Sep Revenue:</strong> ₹2.8L; <strong>Baseline:</strong> ₹1.7L → <strong>+65%</strong>; units 154 vs 92.</li>
                    <li><strong>Insight:</strong> Effective trial funnel feeding future memberships.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">D. Privates: Unexpected Powerhouse</h4>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Sep Revenue:</strong> ₹1.7L; <strong>Baseline:</strong> ₹17.2K → <strong>+988%</strong>; 8 units at <strong>₹24.3K ATV</strong>.</li>
                    <li><strong>Action:</strong> Investigate source; consider formal Private Training program.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">E. Newcomers Special: Acquisition Engine</h4>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-1">
                    <li><strong>Sep Revenue:</strong> ₹52.7K; <strong>Baseline:</strong> ₹1.17K → <strong>+4,400%</strong>; 31 units.</li>
                    <li><strong>Impact:</strong> Primary driver of the 43% increase in unique members.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">3. Customer Behavior & Operational Insights</h3>
              <ul className="list-disc pl-5 text-slate-700 space-y-1 mt-2">
                <li><strong>Member Acquisition:</strong> 75+ new members—barrier‑lowering offers worked.</li>
                <li><strong>ATV:</strong> Slight dip (₹7.8K → ₹7.6K) confirms growth from broader base—positive diversification.</li>
                <li><strong>Discounting:</strong> Revenue grew while discounts fell—strong pricing power.</li>
                <li><strong>Engagement:</strong> Sessions/member fell (8.1 → 3.6) due to large <strong>new‑member dilution</strong>; focus on onboarding.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">4. Strategic Recommendations</h3>
              <ol className="list-decimal pl-5 text-slate-700 space-y-1 mt-2">
                <li><strong>Double Down on Acquisition:</strong> Scale channels bringing the 31 newcomers; reinvest heavily.</li>
                <li><strong>Systematize Private Success:</strong> Identify drivers; formalize a high‑margin Private Training program.</li>
                <li><strong>Nurture New Members:</strong> 3‑week automated sequence to convert trials → memberships.</li>
                <li><strong>Upsell Single‑Class Buyers:</strong> Trigger offers at 3–4 sessions to convert to monthly unlimited.</li>
                <li><strong>Maintain Pricing Discipline:</strong> Avoid deep discounts; lean into value‑based messaging.</li>
              </ol>
            </div>
          </div>
        )}
        {context === 'sales-deep-insights' && isKwality ? (
          <div className="space-y-5">
            <div>
              <p className="font-semibold text-slate-900">3. DEEP INSIGHTS (Go Beyond the Obvious)</p>
              <p className="mt-2 text-slate-700"><strong>Correlation Analysis</strong><br />Strong positive correlations exist between Memberships and average sessions per member (r = 0.72), suggesting memberships act as leading indicators for engagement and revenue (e.g., higher sessions in September 2025 drove 45% of revenue). Lagging indicators include Retail, which correlates with total revenue (r = 0.45) but lags behind Memberships, implying it's more reactive to overall business health. Hidden dependencies include discounts, which negatively correlate with revenue (r = -0.38), indicating that heavy discounting (e.g., ₹1.9L in September 2025) may cause revenue spikes but reduce ATV (down 22% YoY).</p>
              <p className="mt-3 text-slate-700"><strong>Segmentation Insights</strong><br />Breaking down by category, Memberships drive 45% of results (e.g., Studio 1 Month Unlimited generated ₹2.8L in September 2025), while underperforming segments like Privates (only 7% of revenue) show high potential (ATV of ₹24.3K, up 125% YoY). Geography isn't specified, but product segmentation reveals opportunities in urban-focused offerings like Studio packages. High-potential segments include Class Packages for younger demographics (average sessions 7.1 per member), which could be targeted for upselling.</p>
              <p className="mt-3 text-slate-700"><strong>Trend Analysis</strong><br />Micro-trends show increasing member retention in Q3 2025 (average sessions per member up 18% from Q2), but if current trends continue, revenue could dip 10% in Q4 due to historical seasonality (e.g., November 2024 drop). Inflection points include August 2025's anomaly, potentially signaling a trend reversal if not marketing-driven. Projections based on 2025 trends suggest 15% growth by year-end, assuming anomaly correction.</p>
              <p className="mt-3 text-slate-700"><strong>Efficiency & Productivity Metrics</strong><br />Key ratios include revenue per unique member (₹10.2K in September 2025, up 25% YoY) and average sessions per member (3.6 overall, indicating underutilization in Privates at 2.7). Areas of waste include high discounts (7.6% of revenue), with optimization opportunities in bundling (e.g., reducing discounts on Memberships could save ₹50K monthly). Productivity is strong in Memberships, with a 74% efficiency ratio (revenue vs. units sold).</p>
              <p className="mt-3 text-slate-700"><strong>Competitive Position (if data available)</strong><br />Without direct benchmarks, Kwality House's ATV of ₹7.6K (up 10% YoY) suggests a competitive edge in pricing, but disadvantages in retail (lower than industry averages of 15-20% of total revenue) highlight areas for improvement.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">4. INTERESTING OBSERVATIONS & FINDINGS</p>
              <p className="mt-2 text-slate-700">Counter-intuitive patterns include high revenue in August 2025 despite average sessions per member (9.0), challenging the assumption that engagement drives peaks—it may be promotion-driven. Hidden opportunities lie in Privates, with low uptake (only 8 units in September 2025) but high ATV, suggesting untapped demand. Early warning signals include rising discounts (up 35% YoY), potentially signaling price sensitivity. Success patterns, like Memberships' consistent growth, could be replicated in Class Packages. Data quality issues include gaps in "Others" (minimal reporting), and behavioral patterns show members favoring short-term packages during peaks.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">5. ROOT CAUSE ANALYSIS</p>
              <p className="mt-2 text-slate-700">Major changes, like the August 2025 revenue spike, stem from external factors (e.g., promotions, as discounts hit ₹6.8L) rather than internal actions, and appear unsustainable (one-time event based on MoM decline). Positive trends in Memberships are due to internal engagement strategies (e.g., higher sessions), which are sustainable. Underlying dynamics include seasonal demand and discount dependency, explaining volatility.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">6. ACTIONABLE RECOMMENDATIONS</p>
              <p className="mt-2 text-slate-700"><strong>Immediate Actions (This Week)</strong><br />Launch targeted promotions for underperforming segments: Focus on Privates by offering bundled sessions with memberships (expected impact: high, as it could boost revenue by 10-15%; difficulty: low; resources: marketing team; success metric: 20% increase in Private units sold).<br />Review and cap discounts: Analyze September 2025's ₹1.9L in discounts and limit to 5% of revenue (expected impact: medium, saving ₹30K; difficulty: low; resources: sales data; success metric: discount-to-revenue ratio below 6%).</p>
              <p className="mt-3 text-slate-700"><strong>Short-Term Actions (This Month/Quarter)</strong><br />Expand retail cross-selling: Integrate retail with high-engagement memberships (e.g., September 2025's 248 members) to achieve 20% YoY growth (expected impact: high; difficulty: medium; resources: inventory and staff; success metric: retail revenue as 15% of total).<br />Optimize class scheduling: Based on trends, increase sessions for popular packages to raise average sessions per member by 10% (expected impact: medium; difficulty: low; resources: operations team; success metric: 5% revenue uplift from packages).</p>
              <p className="mt-3 text-slate-700"><strong>Long-Term Strategic Actions (6-12 Months)</strong><br />Diversify revenue streams: Invest in new product lines (e.g., online classes) to reduce Membership dependency (expected impact: high; difficulty: high; resources: ₹5L capital; success metric: non-Membership revenue at 40% of total).<br />Build member retention programs: Develop loyalty schemes based on average sessions data (expected impact: medium; difficulty: medium; resources: analytics tools; success metric: 15% increase in retention rate).</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">7. RISK ASSESSMENT</p>
              <p className="mt-2 text-slate-700">Vulnerabilities include revenue concentration in Memberships (45% in September 2025), increasing volatility (standard deviation of 15%), and dependencies on seasonal trends. Sustainability of positive trends (e.g., YoY growth) is at risk if discounts continue rising, potentially eroding 10% of margins.</p>
            </div>
          </div>
        ) : context === 'sales-deep-insights' && isSupreme ? (
          <div className="space-y-5">
            <div>
              <p className="font-semibold text-slate-900">3. DEEP INSIGHTS (Go Beyond the Obvious)</p>
              <p className="mt-2 text-slate-700"><strong>Correlation Analysis</strong><br />Memberships correlate strongly with unique members (r = 0.68), acting as leading indicators for revenue growth (e.g., 36 units in September 2025 drove 48% of total). Lagging indicators include Retail, correlating moderately with revenue (r = 0.45), suggesting it's reactive to membership trends. Hidden dependencies show <strong>discounts negatively impacting ATV (r = -0.41)</strong>, as seen in September 2025's ₹26.1K in discounts reducing overall efficiency.</p>
              <p className="mt-3 text-slate-700"><strong>Segmentation Insights</strong><br />Memberships dominate (48% of revenue), with Studio 1 Month Unlimited leading (₹4.9L in September 2025). Underperforming segments like Privates (negligible revenue) have high potential (ATV of ₹8.8K in May 2025). Segmentation by product reveals opportunities in Class Packages for frequent users (average sessions 3.6 per member), driving 38% of results and suitable for targeted marketing.</p>
              <p className="mt-3 text-slate-700"><strong>Trend Analysis</strong><br />Micro-trends show rising member engagement in Q3 2025 (average sessions up 15% from Q2), but projections indicate a potential 10% dip in Q4 based on historical lows (e.g., November 2024 at ₹9.9L). Inflection points include August's anomaly, possibly from promotions, with trend reversals in Retail (up 35% YoY).</p>
              <p className="mt-3 text-slate-700"><strong>Efficiency & Productivity Metrics</strong><br />Ratios include revenue per unique member (₹10.4K in September 2025, up 20% YoY) and average sessions per member (3.6, indicating moderate utilization). Waste areas include high discounts (17% of revenue in some months), with opportunities in bundling packages to save ₹20K monthly. Productivity is efficient in Memberships, with a 72% revenue-to-units ratio.</p>
              <p className="mt-3 text-slate-700"><strong>Competitive Position (if data available)</strong><br />Supreme HQ's ATV of ₹7.8K (up 15% YoY) suggests a competitive advantage in pricing, but disadvantages in retail (only 3% of revenue) compared to industry benchmarks (10-15%) highlight growth areas.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">4. INTERESTING OBSERVATIONS & FINDINGS</p>
              <p className="mt-2 text-slate-700">Counter-intuitive patterns include August 2025's revenue spike despite stable sessions, challenging engagement assumptions. Hidden opportunities in Privates (high ATV but low sales) could boost revenue by 10%. Early warnings include rising discounts (up 20% YoY), and success patterns in Memberships (consistent growth) merit replication. Data gaps in "Others" (minimal reporting) and behavioral trends show members favoring short-term packages during peaks.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">5. ROOT CAUSE ANALYSIS</p>
              <p className="mt-2 text-slate-700">The August 2025 spike likely resulted from external promotions (e.g., discounts at ₹51.7K), a one-time event not tied to internal actions. Positive trends in Memberships stem from sustained engagement strategies, which are sustainable. Underlying dynamics include seasonal demand and discount reliance, explaining volatility.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">6. ACTIONABLE RECOMMENDATIONS</p>
              <p className="mt-2 text-slate-700"><strong>Immediate Actions (This Week)</strong><br />Promote underutilized segments: Bundle Privates with memberships to increase uptake (expected impact: high, potential 15% revenue gain; difficulty: low; resources: marketing; success metric: 20% rise in Private units).<br />Cap discounts quickly: Limit to 10% of revenue based on September's ₹26.1K (expected impact: medium, saving ₹15K; difficulty: low; resources: sales team; success metric: discount ratio under 12%).</p>
              <p className="mt-3 text-slate-700"><strong>Short-Term Actions (This Month/Quarter)</strong><br />Enhance retail integration: Cross-sell with high-engagement classes (e.g., September's 63 sessions) for 25% YoY growth (expected impact: high; difficulty: medium; resources: inventory; success metric: retail at 5% of total revenue).<br />Boost session scheduling: Target popular packages to raise average sessions by 10% (expected impact: medium; difficulty: low; resources: operations; success metric: 5% session increase).</p>
              <p className="mt-3 text-slate-700"><strong>Long-Term Strategic Actions (6-12 Months)</strong><br />Diversify offerings: Invest in new services like online classes to reduce Membership dependency (expected impact: high; difficulty: high; resources: ₹4L; success metric: non-Membership revenue at 40%).<br />Develop loyalty programs: Use engagement data to retain members (expected impact: medium; difficulty: medium; resources: analytics; success metric: 15% retention improvement).</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">7. RISK ASSESSMENT</p>
              <p className="mt-2 text-slate-700">Vulnerabilities include heavy reliance on Memberships (48% of revenue), volatility from anomalies (standard deviation of 12%), and discount increases eroding margins. Sustainability of trends is at risk if engagement dips, as seen in lower sessions during off-peak months.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((node, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                <div className="text-slate-700 leading-relaxed">{node}</div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default InfoPopover;
