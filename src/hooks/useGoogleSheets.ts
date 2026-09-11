
import { useMemo } from 'react';
import { SalesData } from '@/types/dashboard';
import { requestCache } from '@/utils/performanceOptimizations';
import { fetchSheetValuesSmart, parseNumericValue } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';
import { useSharedDataset } from '@/lib/datasetStore';

const logger = createLogger('useGoogleSheets');

const SPREADSHEET_ID = "1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0";

const EMPTY_SALES: SalesData[] = [];

const buildHeaderIndex = (headers: string[]) => {
  const index = new Map<string, number>();
  headers.forEach((header, position) => {
    if (!index.has(header)) index.set(header, position);
  });
  return index;
};

const makeRowReader = (headerIndex: Map<string, number>, row: any[]) => (header: string) => {
  const position = headerIndex.get(header);
  return position === undefined ? '' : (row[position] ?? '');
};

export const useGoogleSheets = () => {
  const { mode, reportSource } = useDataSource();

  const { data, loading, error, refetch } = useSharedDataset<SalesData[]>(
    `sales:${mode}`,
    async () => {
      const { rows } = await loadDatasetRowsForMode('sales', mode, async () => {
        const result = await requestCache.fetch('google-sheets-sales', async () => {
          logger.info('Fetching sales data from Google Sheets...');
          return fetchSheetValuesSmart(SPREADSHEET_ID, 'Sales');
        });

        return result.values || [];
      }, reportSource);

      if (rows.length < 2) return EMPTY_SALES;

      const headers = rows[0] as string[];
      const headerIndex = buildHeaderIndex(headers);

      const salesData: SalesData[] = rows.slice(1).map((row: any[]) => {
          // Indexed lookup instead of rebuilding a keyed object per row:
          // the old version allocated one object with ~40 keys for every sale.
          const rawItem = makeRowReader(headerIndex, row);

          // Transform to match SalesData interface with camelCase field names
          const transformedItem: SalesData = {
            memberId: rawItem('Member ID') || rawItem('memberId') || '',
            customerName: rawItem('Customer Name') || rawItem('customerName') || '',
            customerEmail: rawItem('Customer Email') || rawItem('customerEmail') || '',
            saleItemId: rawItem('Sale Item ID') || rawItem('saleItemId') || '',
            paymentCategory: rawItem('Payment Category') || rawItem('paymentCategory') || '',
            membershipType: rawItem('Membership Type') || rawItem('membershipType') || '',
            paymentDate: rawItem('Payment Date') || rawItem('paymentDate') || '',
            paymentValue: parseNumericValue(rawItem('Payment Value') || rawItem('paymentValue') || 0),
            paidInMoneyCredits: parseNumericValue(rawItem('Paid in Money Credits') || rawItem('Paid In Money Credits') || rawItem('paidInMoneyCredits') || 0),
            paymentVAT: parseNumericValue(rawItem('Payment VAT') || rawItem('paymentVAT') || 0),
            paymentItem: rawItem('Payment Item') || rawItem('paymentItem') || '',
            paymentStatus: rawItem('Payment Status') || rawItem('paymentStatus') || '',
            paymentMethod: rawItem('Payment Method') || rawItem('paymentMethod') || '',
            paymentTransactionId: rawItem('Payment Transaction ID') || rawItem('paymentTransactionId') || '',
            stripeToken: rawItem('Stripe Token') || rawItem('stripeToken') || '',
            soldBy: rawItem('Sold By') || rawItem('soldBy') || '',
            saleReference: rawItem('Sale Reference') || rawItem('saleReference') || '',
            calculatedLocation: rawItem('Calculated Location') || rawItem('calculatedLocation') || '',
            cleanedProduct: rawItem('Cleaned Product') || rawItem('cleanedProduct') || '',
            cleanedCategory: rawItem('Cleaned Category') || rawItem('cleanedCategory') || '',
            
            // Calculate derived fields
            netRevenue: parseNumericValue(rawItem('Payment Value') || rawItem('paymentValue') || 0) - parseNumericValue(rawItem('Payment VAT') || rawItem('paymentVAT') || 0),
            vat: parseNumericValue(rawItem('Payment VAT') || rawItem('paymentVAT') || 0),
            grossRevenue: parseNumericValue(rawItem('Payment Value') || rawItem('paymentValue') || 0),
            
            // Handle discount columns with multiple possible names
            // Priority: Check primary discount columns first, then sale-level totals, then item-level values
            mrpPreTax: parseNumericValue(
              rawItem('Mrp - Pre Tax') || rawItem('MRP Pre Tax') || rawItem('MRP_Pre_Tax') || 
              rawItem('mrpPreTax') || rawItem('MrpPreTax') || rawItem('Pre Tax MRP') || 
              rawItem('Sale Item Unit Price Excluding VAT') || 0
            ),
            mrpPostTax: parseNumericValue(
              rawItem('Mrp - Post Tax') || rawItem('MRP Post Tax') || rawItem('MRP_Post_Tax') || 
              rawItem('mrpPostTax') || rawItem('MrpPostTax') || rawItem('Post Tax MRP') || 
              rawItem('Sale Item Unit Price Including VAT') || 0
            ),
            discountAmount: parseNumericValue(
              rawItem('Discount Amount -Mrp- Payment Value') || rawItem('Discount Amount') || 
              rawItem('discount_amount') || rawItem('discountAmount') || rawItem('DiscountAmount') ||
              rawItem('Discount_Amount') || rawItem('Total Discount') || rawItem('Discount Value In Currency') || rawItem('Discount Value') || rawItem('Discount Value (In Currency)') || 
              rawItem('Sale Total Discount Value') || rawItem('Sale Total Discount') || rawItem('Sale Item Unit Discount Value') || 0
            ),
            discountPercentage: parseNumericValue(
              rawItem('Discount Percentage - discount amount/mrp*100') || rawItem('Discount Percentage') || 
              rawItem('discount_percentage') || rawItem('discountPercentage') || rawItem('DiscountPercentage') ||
              rawItem('Discount_Percentage') || rawItem('Discount %') || rawItem('Discount_Percent') || 0
            ),
            discountSource: 'none',
            discountIsEstimated: false,
            hostId: rawItem('Host Id') || rawItem('Host ID') || rawItem('hostId') || '',
            // Secondary (Sec.) fields for behavior analytics
            secMembershipStartDate: rawItem('Sec. Membership Start Date') || rawItem('Sec Membership Start Date') || '',
            secMembershipEndDate: rawItem('Sec. Membership End Date') || rawItem('Sec Membership End Date') || '',
            secMembershipTotalClasses: parseNumericValue(rawItem('Sec. Membership Total Classes') || 0),
            secMembershipClassesLeft: parseNumericValue(rawItem('Sec. Membership Classes Left') || 0),
            secMembershipUsedSessions: parseNumericValue(rawItem('Sec. Total Used Sessions') || rawItem('Sec. Membership Used Sessions') || rawItem('Sec. Membership Used Session Credits') || 0),
            // Additional discount indicators
            discountCode: rawItem('Discount Code') || rawItem('discount_code') || rawItem('DiscountCode') || rawItem('Promo Code') || rawItem('promo_code') || '',
            discountType: rawItem('Discount Code') ? 'code' : undefined,
            isPromotional: !!(rawItem('Discount Code') || rawItem('Purchase Type') === 'promotional')
          };

          // Compute fallback discount metrics when missing
          const itemUnitDiscount = parseNumericValue(rawItem('Sale Item Unit Discount Value') || 0);
          const mrp = transformedItem.mrpPostTax && transformedItem.mrpPostTax > 0
            ? transformedItem.mrpPostTax
            : (transformedItem.mrpPreTax || 0);

          if ((transformedItem.discountAmount || 0) > 0 || (transformedItem.discountPercentage || 0) > 0) {
            transformedItem.discountSource = 'sheet';
          }

          // If discountAmount is still 0 but item-level discount exists, use it
          if ((transformedItem.discountAmount || 0) <= 0 && itemUnitDiscount > 0) {
            transformedItem.discountAmount = itemUnitDiscount;
            transformedItem.discountSource = 'item_unit';
          }

          // Fallback: derive discountAmount from MRP vs payment when column is missing/0
          if ((transformedItem.discountAmount || 0) <= 0 && mrp > 0 && (transformedItem.paymentValue || 0) > 0 && mrp > (transformedItem.paymentValue || 0)) {
            transformedItem.discountAmount = mrp - (transformedItem.paymentValue || 0);
            transformedItem.discountSource = 'mrp_gap';
            transformedItem.discountIsEstimated = true;
          }

          // Additional fallback: if still 0 but explicit percentage exists, compute amount
          if ((transformedItem.discountAmount || 0) <= 0 && (transformedItem.discountPercentage || 0) > 0 && mrp > 0) {
            transformedItem.discountAmount = (mrp * (transformedItem.discountPercentage || 0)) / 100;
            transformedItem.discountSource = 'percentage_derived';
            transformedItem.discountIsEstimated = true;
          }

          // Fallback: derive discountPercentage if missing/0
          if ((transformedItem.discountPercentage || 0) <= 0) {
            if (mrp > 0 && (transformedItem.discountAmount || 0) > 0) {
              transformedItem.discountPercentage = (transformedItem.discountAmount! / mrp) * 100;
            } else if (mrp > 0 && (transformedItem.paymentValue || 0) > 0 && mrp > (transformedItem.paymentValue || 0)) {
              transformedItem.discountPercentage = ((mrp - (transformedItem.paymentValue || 0)) / mrp) * 100;
            } else if ((transformedItem.discountAmount || 0) > 0 && (transformedItem.paymentValue || 0) > 0) {
              // Assume effective MRP = payment + discount when MRP is not available
              const effectiveMrp = (transformedItem.paymentValue || 0) + (transformedItem.discountAmount || 0);
              transformedItem.discountPercentage = effectiveMrp > 0 ? ((transformedItem.discountAmount || 0) / effectiveMrp) * 100 : 0;
              transformedItem.discountSource = transformedItem.discountSource === 'none' ? 'effective_mrp' : transformedItem.discountSource;
              transformedItem.discountIsEstimated = true;
            }
          }

          if ((transformedItem.discountAmount || 0) > 0 && transformedItem.discountSource === 'none') {
            transformedItem.discountSource = 'sheet';
          }

          // Normalize rounding
          if (typeof transformedItem.discountAmount === 'number') {
            transformedItem.discountAmount = Math.round(transformedItem.discountAmount * 100) / 100;
          }
          if (typeof transformedItem.discountPercentage === 'number') {
            transformedItem.discountPercentage = Math.round(transformedItem.discountPercentage * 100) / 100;
          }

          return transformedItem;
      });

      logger.info('useGoogleSheets - sales rows parsed', {
        totalRecords: salesData.length,
        sampleRawHeaders: headers.slice(0, 12),
      });

      return salesData;
    },
  );

  return useMemo(
    () => ({ data: data ?? EMPTY_SALES, loading, error, refetch, isLoading: loading }),
    [data, loading, error, refetch],
  );
};
