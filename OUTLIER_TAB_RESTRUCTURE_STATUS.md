# Outlier Analysis Tab Restructuring - Implementation Status

## ✅ COMPLETED TASKS

### 1. Lapsed Member Logic - Freeze Status
**Status: COMPLETED**

- Added `secMembershipIsFreezed` field to `SalesData` type
- Updated lapsed member logic to exclude frozen memberships
- Frozen memberships (where `Sec. Membership Is Freezed = TRUE`) are now considered ACTIVE
- Only members with truly expired memberships (not frozen) appear in lapsed list

**Files Modified:**
- `src/types/dashboard.ts` - Added secMembershipIsFreezed field
- `src/hooks/useOutlierMonthAnalytics.ts` - Lines 504-526 (freeze check logic)

### 2. New Member Attribution Logic
**Status: COMPLETED**

- Changed logic so if a customer's FIRST EVER purchase is in the current month, ALL their purchases in that month count as "new"
- New members making 2nd, 3rd, 4th purchases in the SAME MONTH are attributed to "new" metrics
- This correctly captures the entire value of new customer acquisition in the month they joined

**Files Modified:**
- `src/hooks/useOutlierMonthAnalytics.ts` - Lines 193-220 (isNewCustomer function)

### 3. Comprehensive Revenue Split Metrics
**Status: COMPLETED**

**New Data Structures Added:**
```typescript
newCustomerMetrics: {
  revenue: number;
  unitsSold: number;
  transactions: number;
  uniqueMembers: number;
  atv: number; // Average Transaction Value
  discountedRevenue: number;
  nonDiscountedRevenue: number;
  discountedTransactions: number;
  nonDiscountedTransactions: number;
  totalDiscountAmount: number;
  avgDiscountPercentage: number;
}
repeatCustomerMetrics: {
  // Same structure as newCustomerMetrics
}
```

**Files Modified:**
- `src/hooks/useOutlierMonthAnalytics.ts` - Lines 75-141 (interface), 282-381 (calculations)

### 4. Discounted vs Non-Discounted Bifurcation
**Status: COMPLETED**

- Tracks discounted and non-discounted revenue separately for BOTH new and repeat customers
- Calculates:
  - Revenue from discounted transactions
  - Revenue from non-discounted transactions
  - Count of discounted vs non-discounted transactions
  - Total discount amounts
  - Average discount percentages

**Implementation:**
- Integrated into newCustomerMetrics and repeatCustomerMetrics calculation loop
- Real-time bifurcation as transactions are processed

### 5. Enhanced Drill-Down Modal
**Status: COMPLETED**

**Enhancements Made:**
- **Spender Details View:**
  - Shows total discounts received
  - Displays membership status (Active/Expired/Frozen/None)
  - Shows last membership name and end date
  - Transaction history includes MRP, discount, and savings columns
  
- **Transaction List View:**
  - Added MRP column
  - Added Savings column (MRP - Paid Amount)
  - Shows ATV (Average Transaction Value)
  - Displays total savings across all transactions

**Files Modified:**
- `src/components/dashboard/OutlierDrillDownModal.tsx` - Complete enhancement of all views

### 6. Spender Data Enhancement
**Status: COMPLETED**

**SpenderData Interface Extended:**
```typescript
interface SpenderData {
  // ... existing fields
  lastMembershipName?: string;
  lastMembershipEndDate?: string;
  membershipStatus?: 'Active' | 'Expired' | 'Frozen' | 'None';
  totalDiscountReceived?: number;
}
```

**Spender Bifurcation:**
- `topNewSpenders` - Top 20 new customer spenders
- `topRepeatSpenders` - Top 20 repeat customer spenders
- `bottomNewSpenders` - Bottom 20 new customer spenders
- `bottomRepeatSpenders` - Bottom 20 repeat customer spenders
- Original `topSpenders` and `bottomSpenders` maintained for compatibility

**Files Modified:**
- `src/hooks/useOutlierMonthAnalytics.ts` - Lines 31-50 (interface), 571-647 (calculation)

### 7. Transaction Detail Enhancement
**Status: COMPLETED**

**TransactionDetail Interface Extended:**
```typescript
interface TransactionDetail {
  // ... existing fields
  mrpPreTax?: number;
  mrpPostTax?: number;
  discountType?: string;
  savings?: number; // MRP - Actual Paid
  membershipEndDate?: string;
}
```

**Files Modified:**
- `src/hooks/useOutlierMonthAnalytics.ts` - Lines 52-74 (interface), 771-811 (calculation)

---

## ⏳ REMAINING TASKS

### 1. Update OutlierMonthDetail Component UI
**Status: NOT STARTED**
**Priority: HIGH**

**Required Changes:**
1. **Add Comprehensive Revenue Metrics Section**
   - Display newCustomerMetrics and repeatCustomerMetrics
   - Show revenue, units, transactions, ATV, unique members
   - Bifurcate discounted vs non-discounted metrics
   - Make cards clickable for drill-down

2. **Bifurcate Spenders Tables**
   - Create separate sections for:
     - Top New Spenders (with membership info)
     - Top Repeat Spenders (with membership info)
     - Bottom New Spenders (with membership info)
     - Bottom Repeat Spenders (with membership info)
   - Add columns: Membership Name, End Date, Status, Total Discounts

3. **Enhance Stacked Purchases Table**
   - Add columns:
     - Discount Amount
     - MRP (Pre-tax/Post-tax)
     - Membership Name
     - Date of Purchase
     - Savings
     - Discount Type
   - Make rows clickable for drill-down

4. **Update Membership Breakdown Table**
   - Add click handlers for drill-down by product
   - Show discount metrics per product

**Files to Modify:**
- `src/components/dashboard/OutlierMonthDetail.tsx`

### 2. Add Filters and Location Tabs
**Status: NOT STARTED**
**Priority: HIGH**

**Required Changes:**
1. Add collapsed filter section at the top (similar to other tabs)
2. Ensure location selector tabs work correctly
3. Make filters responsive to date range, location, etc.
4. The OutlierAnalysisSection already has location filtering - just need to add UI components

**Files to Modify:**
- `src/components/dashboard/OutlierAnalysisSection.tsx`

### 3. Update OutlierAnalysisSection Summary Cards
**Status: NOT STARTED**
**Priority: MEDIUM**

**Required Changes:**
- Update April and August summary cards to show:
  - Discounted vs Non-discounted breakdown
  - Units sold
  - ATV
  - Unique members count

**Files to Modify:**
- `src/components/dashboard/OutlierAnalysisSection.tsx`

---

## 📊 DATA FLOW SUMMARY

```
Sales Data Input
      ↓
useOutlierMonthAnalytics Hook
      ↓
   ├─ Filter by month & location
   ├─ Check freeze status for lapsed members
   ├─ Determine new vs repeat (month-based logic)
   ├─ Calculate comprehensive metrics
   │   ├─ newCustomerMetrics (with discount bifurcation)
   │   └─ repeatCustomerMetrics (with discount bifurcation)
   ├─ Build spender lists with membership info
   │   ├─ topNewSpenders
   │   ├─ topRepeatSpenders
   │   ├─ bottomNewSpenders
   │   └─ bottomRepeatSpenders
   └─ Create transaction detail arrays
       ├─ newTransactions (with MRP, savings, etc.)
       └─ repeatTransactions (with MRP, savings, etc.)
      ↓
OutlierMonthDetail Component
      ↓
   ├─ Display comprehensive metrics cards
   ├─ Render bifurcated spender tables
   ├─ Show enhanced stacked table
   └─ Handle click events for drill-down
      ↓
OutlierDrillDownModal
      ↓
   └─ Display detailed transaction data with all enhancements
```

---

## 🎯 KEY BUSINESS LOGIC RULES

1. **New Customer Definition:**
   - First-ever purchase is in the current analysis month
   - ALL purchases in that month count as "new"
   - Example: Customer buys on April 5th (first ever), April 15th, April 25th → All 3 are "new"

2. **Lapsed Member Definition:**
   - Sec. Membership End Date < Today
   - AND Sec. Membership Is Freezed ≠ TRUE
   - Frozen memberships are considered ACTIVE

3. **Stacked Membership Definition:**
   - Sec. Membership End Date >= Purchase Date
   - Customer had an active membership when making new purchase

4. **Discount Metrics:**
   - Tracks both discounted and non-discounted transactions
   - Calculates savings (MRP - Actual Paid)
   - Separate for new and repeat customers

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### Hook Performance
- All metrics calculated in single pass through data (O(n))
- Uses Maps for efficient lookups
- Memoized with useMemo for performance

### Type Safety
- All interfaces properly typed
- Optional fields marked with `?`
- Maintains backward compatibility

### UI Components
- Modular design with reusable modal component
- Click handlers added to all relevant tables
- Hover effects for better UX
- Responsive grid layouts

---

## 📝 NEXT STEPS FOR COMPLETION

1. **Immediate Priority:**
   - Update OutlierMonthDetail.tsx to display all new metrics
   - Create separate spender tables for new/repeat
   - Enhance stacked table with additional fields

2. **Secondary Priority:**
   - Add filter UI components
   - Update summary cards in OutlierAnalysisSection
   - Test all drill-down functionality

3. **Testing:**
   - Verify freeze status exclusion works correctly
   - Test new member attribution with real data
   - Validate discount bifurcation calculations
   - Ensure all drill-down modals open correctly

---

## 📂 FILES MODIFIED

1. `src/types/dashboard.ts` - Added secMembershipIsFreezed field
2. `src/hooks/useOutlierMonthAnalytics.ts` - Major refactor with all enhancements
3. `src/components/dashboard/OutlierDrillDownModal.tsx` - Enhanced with MRP, savings, membership info

## 📂 FILES TO MODIFY

1. `src/components/dashboard/OutlierMonthDetail.tsx` - Needs complete restructuring
2. `src/components/dashboard/OutlierAnalysisSection.tsx` - Add filter UI

---

## 💡 IMPLEMENTATION TIPS

### For OutlierMonthDetail.tsx:

1. Add new metrics section:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* New Customer Metrics Card */}
  <Card>
    <CardHeader>
      <CardTitle>New Customer Metrics</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <MetricDisplay label="Revenue" value={analytics.newCustomerMetrics.revenue} />
        <MetricDisplay label="Units Sold" value={analytics.newCustomerMetrics.unitsSold} />
        <MetricDisplay label="Transactions" value={analytics.newCustomerMetrics.transactions} />
        <MetricDisplay label="ATV" value={analytics.newCustomerMetrics.atv} />
        <MetricDisplay label="Unique Members" value={analytics.newCustomerMetrics.uniqueMembers} />
      </div>
      {/* Discount Bifurcation */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="font-semibold mb-2">Discount Analysis</h4>
        <div className="grid grid-cols-2 gap-2">
          <MetricDisplay label="Discounted Revenue" value={analytics.newCustomerMetrics.discountedRevenue} />
          <MetricDisplay label="Non-Discounted Revenue" value={analytics.newCustomerMetrics.nonDiscountedRevenue} />
        </div>
      </div>
    </CardContent>
  </Card>
  
  {/* Repeat Customer Metrics Card - Same structure */}
</div>
```

2. Bifurcate spender tables:
```tsx
<Tabs defaultValue="new">
  <TabsList>
    <TabsTrigger value="new">New Spenders</TabsTrigger>
    <TabsTrigger value="repeat">Repeat Spenders</TabsTrigger>
  </TabsList>
  <TabsContent value="new">
    {/* topNewSpenders table */}
  </TabsContent>
  <TabsContent value="repeat">
    {/* topRepeatSpenders table */}
  </TabsContent>
</Tabs>
```

---

This document should serve as a complete reference for finishing the implementation. All the complex data processing logic is done - what remains is primarily UI work.
