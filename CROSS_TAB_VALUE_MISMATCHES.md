# Executive Summary Tab vs Individual Tabs - Cross-Reference Audit

## DATA MISMATCHES BETWEEN TABS

### 🔴 CRITICAL: Revenue Numbers Don't Match

**Executive Summary Tab Shows:**
- Top banner: `₹10.3Cr` (103 Million)
- Hero metrics: `1155.5K` (11.55 Million) 
- Sales metrics: `₹36.1L` (3.61 Million)
- Revenue Performance text: `$1212.3K`

**Sales Tab (Individual) Shows:**
- `SalesMetric.title: "Sales Revenue"` 
- Uses `formatCurrency(currentRevenue)` where revenue = `sum(paymentValue - VAT)`
- Calculation in `useSalesMetrics.ts`: `currentRevenue = filterByCurrentMonth().reduce(paymentValue - VAT)`
- **Issue**: Sales tab correctly calculates NET revenue (after VAT), but Executive Summary shows GROSS

**PDF Report Shows:**
- Calculation: `totalRevenue = sales.reduce((sum, s) => sum + (s.paymentValue || 0), 0)` (NO VAT subtraction)
- Uses GROSS revenue, not NET

**Root Cause**: 
- Executive Summary uses GROSS revenue (no VAT deduction)
- Sales tab uses NET revenue (with VAT deduction)
- PDF uses GROSS revenue
- **Inconsistency**: Should use ONE calculation method across all views

---

### 🔴 CRITICAL: Session Count & Attendance Mismatch

**Executive Summary Shows:**
- Hero: "Session Attendance: 77,490"
- Sessions metric: "Total Sessions: 566"
- Average Class Size: 2.7
- Math: 566 × 2.7 = 1,528 (NOT 77,490!)

**Expected Sources:**
- `filteredSessions.length = 566` ✓ (matches)
- `avgClassSize = totalCheckedIn / totalSessions = ? / 566`
- Total attendance shown: "1595 attended" in hero

**Discrepancy:**
- Hero shows 77,490 sessions total (ALL TIME DATA)
- But filtering is set to CURRENT MONTH
- 77,490 is likely total across all data, not filtered to current month

**Root Cause**:
- Top hero banner pulling unfiltered data
- Main section pulling filtered data
- **Need to verify**: Is hero banner intentionally showing all-time? Or data contamination?

---

### 🔴 CRITICAL: Active Members Count Mismatch

**Executive Summary Shows:**
- Hero: "Active Members: 3,705"
- Unique paying: "159"
- New Clients: "136"

**Expected Logic:**
- "Active Members" should be unique members with PAID transactions in current month
- Calculation: `new Set(filteredSales.map(s => s.memberId)).size`
- But shows 3,705 (23x the 159 shown below!)

**Hypothesis:**
- 3,705 = all active members (ALL TIME)
- 159 = unique paying members in CURRENT MONTH
- These are tracking different things!

**Root Cause**:
- Hero banner NOT filtered by date range
- Below sections ARE filtered
- **Inconsistency**: Data source mismatch

---

### 🔴 CRITICAL: New Clients Retention Numbers Wrong

**Executive Summary Shows:**
- Hero: "New Clients: 136" with "13 retained"
- Client Management section: Retention table shows all 0s except one cell
- Month-on-Month table: All prior months show 0 for all classes

**Expected:**
- If 136 new clients, where do "13 retained" come from?
- Retention should be: `clients with retentionStatus === 'Retained' / totalClients`
- But detailed data shows 0s everywhere

**Root Cause**:
- Data not accumulated properly
- Only current month has data
- Historical data missing from source
- **Calculation mismatch**: Hero showing calculated value, detail table showing raw data

---

### 🟠 MAJOR: Trainers Showing Zero (But Data Exists)

**Executive Summary Shows:**
- Key metrics: "Trainers: 0" and "0 sessions"
- BUT Trainer Performance Rankings section shows:
  - Anisha Shah: 32 sessions, 4.8 avg attendance
  - Vivaran Dhasmana: 32 sessions, 3.9 avg attendance
  - 5 top performers listed with real data

**Root Cause**:
- Payroll data filtering issue
- Calculation: `new Set(filteredPayroll.map(p => p.teacherName)).size` = 0
- But sessions table has trainer names
- **Problem**: Payroll data not matching sessions data on trainer names

**Evidence**:
```tsx
// Executive Summary uses:
const filteredPayroll = filterByLocation(
  payrollData?.filter(item => filterByCurrentMonth(item.date || '')) || [],
  'location'
);

// Then tries to count: new Set(filteredPayroll.map(p => p.teacherName)).size
// Returns 0, but sessions data has trainer names from sessions table
```

---

### 🟠 MAJOR: Discounts & Promotions Show Different Values

**Executive Summary (Discounts & Promotions Card) Shows:**
- Total Discounts: "₹33.3K"
- Discount Rate: "2.7%"
- Transactions: "10"
- Customers: "9"

**Individual Discounts Tab Shows:**
- Should calculate: `discountData.filter(d => filterByCurrentMonth(d.paymentDate))`
- Uses location-based filtering: `matchesLocation(d.location)`

**Comparison Logic:**
- Executive shows "vs Nov 2025: ₹0" (+100%)
- This means Nov had NO discounts, Dec has some
- **Issue**: If comparison is +100%, baseline is 0, results are meaningless

**Root Cause**:
- Backend data possibly only has current month
- Or historical discount data not populated
- Comparison metric not useful

---

### 🟠 MAJOR: Leads Conversion Metrics Incomplete

**Executive Summary Leads Section Shows:**
- Total Leads: "104"
- Conversion Rate: "5.8%"
- Trial Conversion: "7.7%"
- Converted Leads: "6"

**Lead Conversion Table Shows:**
- Dashboard: 2 leads, 2 converted (100%)
- Walkin: 4 leads, 1 converted (25%)
- Client Referral: 7 leads, 1 converted (14.3%)
- Hosted Class: 33 leads, 1 converted (3.0%)
- Website: 23 leads, 0 converted (0%)
- Website Form: 12 leads, 0 converted (0%)
- Abandoned Checkout: 11 leads, 0 converted (0%)
- Total: ~97 leads shown

**Discrepancy**:
- Says 104 total but only 97 shown in breakdown
- Missing 7 leads source breakdown
- Conversion calculation: Should be 1 (dash) + 2 (ref) + 1 (walkin) + 1 (hosted) = ~5-6 ✓ (matches)

**Root Cause**:
- Lead sources incomplete in detail table
- Some sources not displayed
- **Missing**: Show ALL lead sources or totals

---

### 🟠 MAJOR: Class Performance Rankings Inconsistent

**Executive Summary Shows:**
- PowerCycle vs Barre comparison (static values)
- Top Trainers section with rankings
- Class Performance shows top 5 by fill rate

**Individual Class Attendance Tab Shows:**
- Likely different class grouping/naming
- May use `cleanedClass` vs `classType`
- Different fill rate calculation method

**Potential Issue**:
- Executive uses simplified class comparison
- Individual tab uses comprehensive class breakdown
- Results may differ due to filtering/calculation differences

---

### 🟠 MAJOR: Late Cancellations Count Mismatch

**Executive Summary Shows:**
- Late Cancellations metric: Shows count
- Uses `lateCancellationsData` from hook

**Sessions Performance Shows:**
- Late Cancellations: "185"
- -2.1% vs last period
- Avg 0.4 per session

**Calculation:**
- Expected: 185 cancellations / 517 sessions = 0.36 per session ✓ (matches 0.4)
- But data source might be filtered differently

---

### 🟠 MAJOR: Fill Rate Shows Two Different Values

**In Same Executive Tab:**
- "Fill Rate: 22%" (in hero/key metrics)
- "Average Fill Rate: 21.8%" (in Sessions Performance section)

**Root Cause**:
- Rounding difference or calculation source difference
- One uses rounded value (22%)
- Other uses precise value (21.8%)
- **Simple fix**: Use same calculation source

---

### 🟡 MEDIUM: Month-on-Month Table Only Has Current Month

**Executive Summary Shows:**
- Month-on-Month sales table with 23 columns (months)
- All columns except Dec show ₹0
- Only December 2025 has actual values

**Individual Sales Tab Shows:**
- Full historical data available (as shown in ProductPerformanceTableNew.tsx)
- Should have data for many months

**Issue:**
- Executive Summary filtering might be too restrictive
- Historical data exists but not displayed
- **Root Cause**: Query returning only current month, prior months empty

---

### 🟡 MEDIUM: Client Type Metrics Show Identical Changes

**Executive Summary Shows (Client Management):**
```
New - Referral Class Metrics:
  +12.5% (Total Clients)
  +8.2% (Visits Post Trial)
  +15.3% (Purchase Count)
  +7.8% (Avg LTV)
  -3.2% (Conversion Span)
  +9.1% (Total Visits)

New - Trial Class Metrics:
  +12.5% (Total Clients) ← IDENTICAL
  +8.2% (Visits Post Trial) ← IDENTICAL
  +15.3% (Purchase Count) ← IDENTICAL
  +7.8% (Avg LTV) ← IDENTICAL
  -3.2% (Conversion Span) ← IDENTICAL
  +9.1% (Total Visits) ← IDENTICAL

... (all 9 client types show IDENTICAL percentages)
```

**Problem:**
- All client types showing identical % changes
- This is statistically impossible
- **Clearly placeholder/mock data**

**Root Cause**:
- Calculations not implemented properly
- Using template values instead of real calculations
- **Fix**: Replace with actual month-over-month calculations

---

## CROSS-TAB VALUE COMPARISON TABLE

| Metric | Executive Summary | Individual Tab | Match? | Issue |
|--------|------------------|-----------------|--------|-------|
| Total Revenue | ₹36.1L (gross?) | Varies (net after VAT) | ❌ | Revenue type mismatch |
| Session Count | 566 | 517 | ❌ | Different filtering |
| Total Attendance | 1,595 | Should match sessions × avg | ❌ | Source mismatch |
| Session Avg | 2.7 | Should match attendance/sessions | ❌ | Math doesn't work |
| Active Members | 3,705 (hero) vs 159 | N/A - check definition | ❌ | Different time periods |
| New Clients | 136 | Matches filtered count | ✓ | Good |
| Retained Clients | 13 | Table shows 0s | ❌ | Data not accumulated |
| Trainers | 0 | Shows 5+ in rankings | ❌ | Data filtering issue |
| Discounts | ₹33.3K | Should show sales tab value | ? | Needs verification |
| Leads Converted | 6 | Table shows similar | ✓ | Approximately matches |
| Late Cancellations | 185 | 0.4/session avg | ✓ | Math works out |
| Fill Rate | 22% vs 21.8% | Sessions tab value | ≈ | Rounding difference |

---

## PRIORITY FIXES

### 🚨 IMMEDIATE (Data Integrity)

1. **Fix Revenue Calculation**
   - Decide: NET (after VAT) or GROSS (before VAT)?
   - Apply consistently across all tabs
   - Update PDF export

2. **Fix Session Attendance Math**
   - Verify: Total Sessions, Total Attendance, Average
   - Should follow: `Avg = Total Attendance / Total Sessions`
   - Fix hero banner to use filtered data

3. **Fix Trainers = 0**
   - Debug payroll data filtering
   - Ensure payroll.teacherName matches sessions.trainerName
   - Verify location matching

4. **Replace Placeholder Client Metrics**
   - Implement real month-over-month calculations
   - Remove identical percentage values
   - Use actual prior month data

### 🟠 HIGH PRIORITY (Data Consistency)

5. Fix Active Members definition (all-time vs filtered)
6. Fix New Clients retention calculation
7. Populate historical data in MoM table
8. Verify discounts data source
9. Show all lead sources in breakdown

### 🟡 MEDIUM (Polish)

10. Fix fill rate decimal precision (22% vs 21.8%)
11. Add historical data to Client Retention
12. Verify Lead conversion totals add up correctly

