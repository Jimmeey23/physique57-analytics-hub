import type { MetricDefinition } from '@/components/ui/MetricDefinitions';

/**
 * Per-tab metric definitions, audited against the actual computation code.
 * Rendered in a collapsed index at the bottom of each page.
 */
export const METRIC_DEFINITIONS: Record<string, MetricDefinition[]> = {
  home: [
    { name: 'Total revenue', formula: 'Σ grossRevenue', text: 'Sum of grossRevenue across all synced sales rows (all locations, full history). Formatted compact: Cr above ₹1Cr, L above ₹1L.' },
    { name: 'Unique members', formula: '|distinct memberId|', text: 'Count of distinct non-empty memberId values across all sales rows.' },
    { name: 'Records synced', formula: 'rows.length', text: 'Raw count of synced sales rows in the current dataset.' },
    { name: 'Avg revenue / member', formula: 'Σ grossRevenue ÷ |distinct memberId|', text: 'Total revenue divided by unique members. Shows — when there are no members.' },
  ],
  mainDashboard: [
    { name: 'Total Classes', formula: 'sessions.length', text: 'Count of session rows after global filters. Empty sessions (0 check-ins) are included here.' },
    { name: 'Check-ins', formula: 'Σ checkins', text: 'Sum of checked-in attendees across filtered sessions (hook field checkedInCount, normalised at the component boundary).' },
    { name: 'Fill Rate', formula: 'Σ checkins ÷ Σ capacity × 100', text: 'Checked-in attendance as a share of total session capacity. 0 when capacity is 0.' },
    { name: 'Total Revenue', formula: 'Σ revenue', text: 'Sum of session revenue (hook field totalPaid).' },
    { name: 'Cancellation Rate', formula: 'Σ lateCancelled ÷ Σ bookings × 100', text: 'Late cancellations as a share of total bookings (hook field bookedCount).' },
    { name: 'Consistency', formula: '100 − (σ ÷ μ × 100), floored at 0', text: '100 minus the coefficient of variation of per-session check-ins — high when every class fills evenly, low when attendance swings.' },
    { name: 'Class Average', formula: 'Σ checkins ÷ sessions', text: 'Mean checked-in attendance per session, including empty sessions.' },
    { name: 'Composite Score', formula: 'attendance×40% + fill×35% + sessions×25%', text: 'Weighted score: class average normalised to 20 = 100, fill rate as-is, session count normalised to 50 = 100.' },
  ],
  executiveSummary: [
    { name: 'Total Revenue', formula: 'Σ paymentValue (location-filtered)', text: 'Gross payment value of sales rows matching the selected location. Respects the global location filter.' },
    { name: 'Active Members', formula: '|distinct memberId| in filtered sales', text: 'Distinct members with at least one sale row in the filtered set — a purchasing-activity proxy, not a membership-status count.' },
    { name: 'Session Attendance', formula: 'Σ checkedInCount (location-filtered)', text: 'Total checked-in visits across sessions matching the selected location.' },
    { name: 'Lead Conversion', formula: 'Converted ÷ leads × 100', text: 'Share of location-filtered leads whose conversionStatus is exactly “Converted”.' },
  ],
  sales: [
    { name: 'Total revenue', formula: 'Σ paymentValue', text: 'Gross payment value across all sales rows in the active dataset.' },
    { name: 'Transactions', formula: 'rows.length', text: 'Count of sales rows (line items) in the dataset.' },
    { name: 'Avg ticket', formula: 'Σ paymentValue ÷ rows', text: 'Mean payment value per sales row. Shows — with no rows.' },
    { name: 'Net revenue (tables)', formula: 'Σ (paymentValue − VAT)', text: 'Product/category tables report NET revenue: payment value minus paymentVAT (falling back to vat) per row.' },
    { name: 'ATV / AUV / UPT', formula: 'ATV = net ÷ txns · AUV = net ÷ members · UPT = units ÷ txns', text: 'Average transaction value, average unit/member value and units per transaction. Transactions counted by distinct paymentTransactionId (rows if absent); units by distinct sale/sales item id (rows if absent).' },
    { name: 'Discount %', formula: 'Σ discountAmount ÷ Σ paymentValue × 100', text: 'Discount depth against GROSS revenue (pre-VAT payment value).' },
    { name: 'Purchase Frequency', formula: 'span days ÷ (purchases − 1)', text: 'Mean days between consecutive purchases: date span of the rows divided by one less than the row count. 0 with a single purchase.' },
  ],
  funnelLeads: [
    { name: 'Total Leads', formula: 'filtered rows', text: 'Count of lead rows after all active filters.' },
    { name: 'Converted', formula: '|converted|', text: 'Leads count as converted when conversionStatus is “Converted”, or the stage contains membership sold / converted / conversion / member / membership / sold (case-insensitive).' },
    { name: 'Conversion Rate', formula: 'converted ÷ leads × 100', text: 'Converted leads as a share of filtered leads. 0 with no leads.' },
  ],
  clientRetention: [
    { name: 'Total Trials', formula: 'filtered rows', text: 'Count of new-client sheet rows after filters. The denominator for the cohort rates below.' },
    { name: 'Conversion Rate', formula: '|conversionStatus = Converted| ÷ trials × 100', text: 'Rows whose conversionStatus is exactly “Converted”. No isNew gate — status column is the source of truth.' },
    { name: 'Retention Rate', formula: '|retentionStatus = Retained| ÷ trials × 100', text: 'Rows whose retentionStatus is exactly “Retained”.' },
    { name: 'Avg LTV', formula: 'Σ ltv ÷ trials', text: 'Mean lifetime value across trial rows (ltv column, missing treated as 0).' },
    { name: 'New-client cohort', formula: 'isNew ≈ “new…”', text: 'A row joins the new-client cohort when its isNew value normalises to “new” or starts with “new ” (“not new…” excluded).' },
  ],
  trainerPerformance: [
    { name: 'Trainers (per location)', formula: '|distinct teacherName|', text: 'Distinct payroll teacher names at Kwality / Supreme / Kenkere (Kenkere matches by inclusion, others exact).' },
    { name: 'Avg revenue / trainer', formula: 'Σ totalPaid ÷ trainers', text: 'Payroll-reported revenue per trainer at the location.' },
    { name: 'Sessions (payroll)', formula: 'Σ totalSessions', text: 'Payroll-reported session count summed per trainer/location — the workload basis for efficiency views.' },
  ],
  classAttendance: [
    { name: 'Total Classes', formula: 'filtered sessions', text: 'Count of session rows after location + global filters.' },
    { name: 'Total Attendance', formula: 'Σ checkedInCount', text: 'Checked-in attendees summed across the filtered sessions.' },
    { name: 'Fill Rate', formula: 'Σ checkedInCount ÷ Σ capacity × 100', text: 'Attendance as a share of summed capacity. 0 when capacity is 0.' },
  ],
  classFormats: [
    { name: 'Total Sessions', formula: 'filtered sessions', text: 'Session rows after global + location filters — the basis for every format comparison on this tab.' },
    { name: 'Avg Fill', formula: 'Σ checkedInCount ÷ Σ capacity × 100', text: 'Overall fill across the filtered set (PowerCycle vs Barre vs Strength pool together here; per-format splits appear in the tables).' },
    { name: 'Total Revenue', formula: 'Σ totalPaid', text: 'Session revenue summed across the filtered set.' },
  ],
  discounts: [
    { name: 'Monthly Discounts (per location)', formula: 'Σ discountAmount in default month', text: 'Discount rupees per studio for the dashboard default month window (first → last day), matched on paymentDate via calculatedLocation.' },
    { name: 'Discount depth', formula: 'Σ discountAmount ÷ Σ paymentValue × 100', text: 'Rupees discounted as a share of gross payment value in the active window.' },
    { name: 'Discount penetration', formula: '|discounted txns| ÷ txns × 100', text: 'Share of transactions carrying any discountAmount > 0.' },
  ],
  sessions: [
    { name: 'Total Check-ins (per location)', formula: 'Σ checkedInCount', text: 'Checked-in visits summed per studio (Kwality / Supreme / Kenkere / Pop-up) across the full sessions dataset.' },
    { name: 'Sessions Held', formula: '|distinct sessionId|', text: 'Distinct session ids — the class count behind attendance in patterns views.' },
  ],
  outlierLab: [
    { name: 'Rows (per source)', formula: 'dataset.length', text: 'Raw synced row counts for Sales, Sessions, Leads and Payroll feeding the Data Lab workspace.' },
    { name: 'Pivots & models', formula: 'user-defined', text: 'Every pivot aggregation, chart model and relationship in the lab is computed live from the source rows above — no pre-aggregated numbers.' },
  ],
  expirations: [
    { name: 'Memberships', formula: 'expiration rows', text: 'Count of membership rows in the expirations dataset.' },
    { name: 'Active / Churned / Frozen', formula: '|status = X|', text: 'Rows grouped by exact status value. Churn rate = churned ÷ memberships × 100.' },
    { name: 'Churn rate', formula: 'churned ÷ memberships × 100', text: 'Share of membership rows with status “Churned”. 0 with no rows.' },
  ],
  lateCancellations: [
    { name: 'Late Cancellations (per location)', formula: 'filtered late-cancel rows', text: 'Late-cancellation records per studio after filters (location matched by inclusion: Kwality / Supreme / Kenkere).' },
    { name: 'Cancellation Records (fallback)', formula: 'filtered check-in rows', text: 'When no late-cancel rows exist, the hero falls back to counting check-in records per location so the tab still reports coverage.' },
    { name: 'Late-cancel rate', formula: 'late cancels ÷ bookings × 100', text: 'Late cancellations as a share of bookings in the active window.' },
  ],
  patterns: [
    { name: 'Total Visits', formula: '|checkedIn = true|', text: 'Check-in rows flagged checkedIn in the location-filtered set.' },
    { name: 'Unique Members', formula: '|distinct memberId|', text: 'Distinct members behind the filtered check-ins.' },
    { name: 'Sessions Held', formula: '|distinct sessionId|', text: 'Distinct sessions behind the filtered check-ins.' },
  ],
  overview: [
    { name: 'Source Modules', formula: 'modules.length', text: 'Count of overview source modules available in this build.' },
    { name: 'Active View / Date Window / Location', formula: 'current filter state', text: 'Echoes of the active module, date range and location filter driving the overview.' },
  ],
  commandCenter: [
    { name: 'Sales Revenue', formula: 'Σ paymentValue (filtered)', text: 'Gross sales payment value inside the active filter window.' },
    { name: 'ATV', formula: 'revenue ÷ distinct txns', text: 'Average transaction value: filtered revenue over distinct transactions.' },
    { name: 'Unique Members', formula: '|distinct purchasing members|', text: 'Distinct community members with a purchase in the window.' },
    { name: 'Class Average', formula: 'Σ checkedIn ÷ sessions', text: 'Mean checked-in attendance per studio session.' },
    { name: 'Fill Rate', formula: 'Σ checkedIn ÷ Σ capacity × 100', text: 'Checked-in attendance as a share of session capacity.' },
    { name: 'Visitors', formula: '|distinct checked-in|', text: 'Distinct checked-in visitors in the window.' },
    { name: 'Revenue/Visit', formula: 'sales revenue ÷ visits', text: 'Sales revenue divided by checked-in visits — commercial yield per studio visit.' },
    { name: 'Lapsed', formula: '|expired/lapsed access|', text: 'Expired or lapsed access records in the window. Down-trends are good here.' },
    { name: 'MoM delta', formula: '(latest − prev) ÷ |prev| × 100', text: 'Each card compares the latest full month bucket against the previous one.' },
  ],
  forecasting: [
    { name: '90-day forecast', formula: 'Σ next-3-month forecasts', text: 'Sum of forecasted revenue for the next 3 calendar months. Each month compounds the prior projection by a tapered growth rate (average MoM growth, clamped ±20%, decaying 18% per step, floor ×0.5).' },
    { name: 'Forecast confidence', formula: 'mean confidence', text: 'Mean of per-month confidences. Base = 84 − depth penalty (4 per missing month under 6) − volatility penalty (≤12); minus 9 per month ahead; floored at 55.' },
    { name: 'Open actions', formula: '|action queue| ≤ 18', text: 'Renewal + churn-rescue + collections actions merged, sorted by priorityScore then value-at-risk, capped at 18.' },
    { name: 'Outstanding exposure', formula: 'Σ unpaidAmount (risk members)', text: 'Unpaid rupees summed across members flagged with payment risk.' },
    { name: 'Churn score', formula: 'visit-decline model 0–100', text: 'Members ranked by declineRate (visits vs prior 3-month window); ≥80 critical, ≥60 high. Value-at-risk = member lifetime paid or ATV.' },
  ],
  lifecycle: [
    { name: 'Tracked members', formula: 'member rows', text: 'All member rows loaded into the 360° model.' },
    { name: 'Active members', formula: 'segment ≠ inactive + has activity', text: 'Members with a non-inactive segment and a recorded last-activity month.' },
    { name: 'At-risk members', formula: 'segment ∈ {at-risk, unreliable}', text: 'Unreliable = cancellation rate > 30% or payment compliance < 70%. High-value = lifetime paid > ₹20K; engaged = 20+ visits and 80%+ show-up; reliable = 10+ visits and 70%+ show-up.' },
    { name: 'Avg show-up rate', formula: 'mean(visits ÷ bookings × 100)', text: 'Per-member visits over bookings, averaged across members.' },
    { name: 'Collection efficiency', formula: 'paid ÷ billed × 100', text: 'Collected rupees as a share of billed rupees across member financials.' },
  ],
  locationReport: [
    { name: 'Total Revenue', formula: 'Σ paymentValue', text: 'Gross sales payment value for the location and period.' },
    { name: 'Fill Rate', formula: 'Σ checkedIn ÷ Σ capacity × 100', text: 'Attendance vs capacity. Banded Excellent ≥85%, Good ≥70%, Fair ≥50%, else Poor.' },
    { name: 'Avg Class Size', formula: 'Σ checkedIn ÷ sessions', text: 'Mean attendance per session at the location.' },
    { name: 'Conversion Rate', formula: 'converted ÷ leads × 100', text: 'Lead conversion for the location using the unified converted-lead rule.' },
    { name: 'MoM change', formula: '(current − prev) ÷ prev × 100', text: 'Each headline metric is compared against the previous equivalent period.' },
  ],
  studioPulse: [
    { name: 'Net Sales', formula: 'gross − discount (− VAT)', text: 'Retained revenue after discounts and VAT for the active period. Subtext shows gross and discount legs.' },
    { name: 'Units Sold', formula: '|completed txns|', text: 'Completed sales transactions in the window. Subtext shows ATV and discount penetration.' },
    { name: 'Unique Members', formula: '|distinct buyers|', text: 'Distinct purchasing members — customer reach across the active sales mix.' },
    { name: 'Lapsed Members', formula: '|expired in period|', text: 'Memberships expired in the selected period, sourced from the Expirations sheet. Subtext splits churned.' },
    { name: 'Visits', formula: 'Σ attendance', text: 'Checked-in session visits in the window.' },
    { name: 'MoM / YoY growth', formula: '(current − base) ÷ base × 100', text: 'Every card carries month-on-month and year-on-year growth plus sparklines; click a card to drill into its records.' },
  ],
  executiveReport: [
    { name: 'Revenue & Commercial', formula: 'sales aggregates', text: 'Net/gross revenue, ATV, units and member spend stitched from the sales dataset for the report window.' },
    { name: 'Attendance & Utilisation', formula: 'sessions aggregates', text: 'Check-ins, fill rate, class average and capacity use from the sessions dataset.' },
    { name: 'Lead Funnel & Acquisition', formula: 'leads aggregates', text: 'Lead volume and conversion using the unified converted-lead rule.' },
    { name: 'Trainer Performance', formula: 'payroll aggregates', text: 'Per-trainer sessions and revenue from payroll data.' },
    { name: 'Lapsed & Churn', formula: 'expirations aggregates', text: 'Expired/churned membership counts and churn rate from the expirations dataset.' },
    { name: 'Late Cancellations', formula: 'late-cancel aggregates', text: 'Late-cancel volume and rate from late-cancellation records.' },
  ],
};
