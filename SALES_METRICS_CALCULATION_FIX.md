# Sales Metrics Calculation Fix - Summary

## Issue Resolved
The "Sold By" and "Payment Method" tables in the Sales tab were showing zero values for purchase frequency, discount amount, and discount percentage metrics due to hardcoded values and incorrect calculations.

## Root Cause Analysis
1. **Hardcoded Discount Percentage**: `const avgDiscountPercentage = 10;` was using a fixed 10% instead of calculating from actual data
2. **Incorrect VAT Calculation**: `item.paymentValue * 0.18` was calculating 18% VAT instead of using the actual `paymentVAT` field
3. **Missing Metrics**: Purchase frequency and discount value cases were not handled in the switch statements
4. **Incomplete Formatting**: New metrics were not properly formatted in the display functions

## Files Modified

### 1. PaymentMethodMonthOnMonthTableNew.tsx
**Changes Made:**
- **Line 46**: Replaced `const avgDiscountPercentage = 10;` with proper calculation using actual discount data
- **Line 45**: Changed `item.paymentValue * 0.18` to use `item.paymentVAT || item.vat || 0`
- **Added Purchase Frequency**: Implemented calculation using date sorting and time differences between purchases
- **Updated Switch Statement**: Added cases for `purchaseFrequency` and `discountValue`
- **Enhanced Formatting**: Updated `formatMetricValue` to handle currency formatting for `discountValue` and time formatting for `purchaseFrequency`

**Key Code Changes:**
```typescript
// OLD (Hardcoded)
const avgDiscountPercentage = 10;
const totalVat = items.reduce((sum, item) => sum + (item.paymentValue * 0.18), 0);

// NEW (Data-driven)
const itemsWithDiscount = items.filter(item => (item.discountAmount || 0) > 0);
const avgDiscountPercentage = itemsWithDiscount.length > 0 
  ? itemsWithDiscount.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / itemsWithDiscount.length
  : 0;
const totalVat = items.reduce((sum, item) => sum + (item.paymentVAT || item.vat || 0), 0);
```

### 2. SoldByMonthOnMonthTableNew.tsx
**Changes Made:**
- **Added Purchase Frequency Calculation**: Implemented the same sophisticated purchase frequency algorithm
- **Enhanced Switch Statement**: Added `purchaseFrequency` case
- **Updated Formatting**: Added proper formatting for `discountValue` (currency) and `purchaseFrequency` (days)

**Key Code Addition:**
```typescript
case 'purchaseFrequency': return calculatePurchaseFrequency();
case 'discountValue': return formatCurrency(value);
case 'purchaseFrequency': return `${value.toFixed(1)} days`;
```

## Technical Implementation Details

### Purchase Frequency Algorithm
The purchase frequency calculation determines the average number of days between purchases for each member:

1. **Member Grouping**: Groups all purchases by `memberId`
2. **Date Parsing**: Converts payment dates to proper Date objects
3. **Time Difference Calculation**: Sorts dates chronologically and calculates intervals
4. **Average Calculation**: Returns the mean days between purchases across all members

### Data Integrity Improvements
- **Actual VAT Usage**: Now uses `paymentVAT` field from data instead of calculating percentages
- **Real Discount Data**: Leverages `discountAmount` and `discountPercentage` fields from the SalesData interface
- **Null Safety**: Proper handling of missing or zero values in calculations
- **Type Safety**: Maintains TypeScript compliance with YearOnYearMetricType interface

## Expected Results
After these fixes, the Sales tab tables should now display:

1. **Purchase Frequency**: Real average days between customer purchases (e.g., "15.3 days")
2. **Discount Amount**: Actual monetary discount values in currency format (e.g., "$125.50")
3. **Discount Percentage**: Calculated average discount percentages (e.g., "12.5%")
4. **VAT Values**: Correct VAT amounts from the data source

## Validation Steps
1. Navigate to Sales tab
2. Switch to "Sold By" table and verify non-zero metrics
3. Switch to "Payment Method" table and verify non-zero metrics  
4. Test different metric selections (Purchase Frequency, Discount Amount, Discount %)
5. Confirm proper formatting (currency symbols, percentage signs, "days" unit)

## Files Status
- ✅ PaymentMethodMonthOnMonthTableNew.tsx - Fully updated
- ✅ SoldByMonthOnMonthTableNew.tsx - Fully updated  
- ✅ All hardcoded values removed
- ✅ Proper data field usage implemented
- ✅ Enhanced metric formatting applied

The Sales analytics tables should now accurately reflect real business data instead of placeholder values.