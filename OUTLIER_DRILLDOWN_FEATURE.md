# Outlier Analysis Drill-Down Feature

## Overview
The Outlier Analysis tab now includes comprehensive drill-down functionality with individual-level transaction data and accurate business logic for new/repeat sales classification.

## Key Features Implemented

### 1. **Revenue Bifurcation**
- **New Client Revenue Card**: Click to see all first-time buyer transactions
- **Repeat Client Revenue Card**: Click to see all returning customer transactions
- Real-time calculation showing percentage distribution
- Transaction counts and detailed breakdowns

### 2. **Interactive Tables with Drill-Down**
All tables now support click-to-explore functionality:

#### **Top Spenders Table**
- Click any row to view customer's complete transaction history
- See all purchases, discounts applied, and locations
- Identify if customer is new or repeat
- Calculate average transaction value

#### **Bottom Spenders Table**  
- Same drill-down capabilities as top spenders
- Identify growth opportunities
- Track low-value customer engagement

#### **Lapsed Members Table**
- Click to see full purchase history
- View membership timeline
- Calculate lifetime value
- See days since membership lapsed
- Review last purchase details

### 3. **Drill-Down Modal Features**

#### **Spender Details View**
- Summary cards showing:
  - Total amount spent
  - Number of transactions
  - Average transaction value
  - New vs. existing client badge
- Complete transaction history table with:
  - Date of each purchase
  - Product name
  - Transaction amount
  - Discount details (amount & percentage)
  - Location

#### **Lapsed Member Details View**
- Summary cards showing:
  - Days since membership lapsed
  - Total lifetime value
  - Last purchase amount
  - Last membership type
- Membership end date callout
- Full purchase history with membership end dates

#### **Transaction List View** (New/Repeat)
- Summary metrics:
  - Total revenue
  - Transaction count
  - Total discounts applied
  - Number of stacked purchases
- Detailed transaction table with:
  - Purchase date
  - Customer name
  - Product purchased
  - Amount paid
  - Discount information
  - Status badges (New/Stacked)

## Business Logic Updates

### **New vs. Repeat Sales Classification**
- **New Sale**: Customer's **first transaction ever** across entire dataset
- **Repeat Sale**: Any subsequent transaction after the first
- Logic checks customer's first purchase date across all data
- Normalized date comparison prevents timezone issues

### **Membership Stacking Detection**
- A purchase is "stacked" if:
  - Customer has an active membership (Sec. Membership End Date exists)
  - AND Sec. Membership End Date >= purchase date (normalized to midnight)
- Helps identify customers buying while already having active memberships

### **Lapsed Member Criteria**
- Only shows members whose **Sec. Membership End Date < today**
- Uses normalized dates (set to midnight) for accurate comparison
- Excludes any members with active memberships
- Shows days since membership expired

## Technical Implementation

### **Hook: `useOutlierMonthAnalytics.ts`**
Returns extended analytics object with:
```typescript
{
  // Existing fields...
  newTransactions: TransactionDetail[];      // All first-time buyer transactions
  repeatTransactions: TransactionDetail[];    // All returning customer transactions
  allTransactions: SalesData[];              // Raw sales data
  topSpenders: SpenderData[];                // With rawTransactions[]
  bottomSpenders: SpenderData[];             // With rawTransactions[]
  lapsedMembers: LapsedMemberData[];         // With rawTransactions[]
}
```

### **Component: `OutlierDrillDownModal.tsx`**
Reusable modal component supporting multiple view modes:
- `type: 'spender'` - Show spender details
- `type: 'lapsed'` - Show lapsed member details
- `type: 'new-transactions'` - Show new customer transactions
- `type: 'repeat-transactions'` - Show repeat customer transactions

### **Component: `OutlierMonthDetail.tsx`**
Enhanced with:
- Click handlers on revenue cards
- Click handlers on all table rows
- Modal state management
- Hover effects for clickable elements

## User Experience Improvements

1. **Visual Feedback**
   - Cards and rows change color on hover
   - Cursor changes to pointer on clickable elements
   - "Click for details" hint in revenue cards

2. **Comprehensive Data**
   - No need to export to see individual transactions
   - All relevant details in one modal view
   - Scrollable tables for large datasets

3. **Business Insights**
   - Quickly identify high-value customers
   - Understand new vs. repeat revenue mix
   - Target lapsed members for win-back campaigns
   - Analyze discount effectiveness at individual level

## Future Enhancement Opportunities

1. **Export from Modal**: Add CSV export for drill-down data
2. **Filtering**: Add date range filters within modal
3. **Sorting**: Allow sorting by different columns
4. **Search**: Search for specific customers or transactions
5. **Comparison**: Compare multiple customers side-by-side
6. **Actions**: Add direct actions (email customer, add note, etc.)

## Files Modified

1. `src/hooks/useOutlierMonthAnalytics.ts` - Core logic and data preparation
2. `src/components/dashboard/OutlierMonthDetail.tsx` - UI with click handlers
3. `src/components/dashboard/OutlierDrillDownModal.tsx` - New modal component (created)

## Testing Checklist

- [x] Click New Client Revenue card → Shows correct first-time transactions
- [x] Click Repeat Client Revenue card → Shows correct returning customer transactions
- [x] Click Top Spender row → Shows customer's full transaction history
- [x] Click Bottom Spender row → Shows customer's full transaction history
- [x] Click Lapsed Member row → Shows membership history and lifetime value
- [x] Verify new customer logic (only first transaction marked as new)
- [x] Verify stacking logic (active membership at purchase)
- [x] Verify lapsed member logic (only expired memberships)
- [ ] Test with different date ranges
- [ ] Test with different locations
- [ ] Verify modal closes properly
- [ ] Test scrolling in large datasets
