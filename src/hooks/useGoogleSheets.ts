
import { useState, useEffect } from 'react';
import { SalesData } from '@/types/dashboard';

const GOOGLE_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID_1.apps.googleusercontent.com",
  CLIENT_SECRET: "GOCSPX-REDACTED_SECRET_1",
  REFRESH_TOKEN: "REDACTED_REFRESH_TOKEN_1B",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = "1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0";

export const useGoogleSheets = () => {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAccessToken = async () => {
    try {
      const response = await fetch(GOOGLE_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
          refresh_token: GOOGLE_CONFIG.REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await response.json();
      return tokenData.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  const parseNumericValue = (value: string | number): number => {
    // Robust parser: handles currency symbols, commas, spaces, and percent signs
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (!value || value === '') return 0;

    const cleaned = value
      .toString()
      .trim()
      // Remove currency symbols and thousand separators
      .replace(/[₹,\s]/g, '')
      // Allow parseFloat to stop at non-numeric (e.g., %), so no need to strip % explicitly
      ;
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      console.log('Fetching sales data from Google Sheets...');
      const accessToken = await getAccessToken();
      console.log('Access token obtained successfully');
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sales?alt=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      const rows = result.values || [];
      
      if (rows.length < 2) {
        setData([]);
        return;
      }

      const headers = rows[0];
      console.log('Sheet headers:', headers);
      
      // Transform the raw data to match SalesData interface - optimize with batching
      const batchSize = 100;
      const salesData: SalesData[] = [];
      
      const processRowsBatch = (startIndex: number, endIndex: number) => {
        const batch = rows.slice(startIndex, endIndex).map((row: any[]) => {
          const rawItem: any = {};
          headers.forEach((header: string, index: number) => {
            rawItem[header] = row[index] || '';
          });

          // Transform to match SalesData interface with camelCase field names
          const transformedItem: SalesData = {
            memberId: rawItem['Member ID'] || rawItem['memberId'] || '',
            customerName: rawItem['Customer Name'] || rawItem['customerName'] || '',
            customerEmail: rawItem['Customer Email'] || rawItem['customerEmail'] || '',
            saleItemId: rawItem['Sale Item ID'] || rawItem['saleItemId'] || '',
            paymentCategory: rawItem['Payment Category'] || rawItem['paymentCategory'] || '',
            membershipType: rawItem['Membership Type'] || rawItem['membershipType'] || '',
            paymentDate: rawItem['Payment Date'] || rawItem['paymentDate'] || '',
            paymentValue: parseNumericValue(rawItem['Payment Value'] || rawItem['paymentValue'] || 0),
            paidInMoneyCredits: parseNumericValue(rawItem['Paid in Money Credits'] || rawItem['Paid In Money Credits'] || rawItem['paidInMoneyCredits'] || 0),
            paymentVAT: parseNumericValue(rawItem['Payment VAT'] || rawItem['paymentVAT'] || 0),
            paymentItem: rawItem['Payment Item'] || rawItem['paymentItem'] || '',
            paymentStatus: rawItem['Payment Status'] || rawItem['paymentStatus'] || '',
            paymentMethod: rawItem['Payment Method'] || rawItem['paymentMethod'] || '',
            paymentTransactionId: rawItem['Payment Transaction ID'] || rawItem['paymentTransactionId'] || '',
            stripeToken: rawItem['Stripe Token'] || rawItem['stripeToken'] || '',
            soldBy: rawItem['Sold By'] || rawItem['soldBy'] || '',
            saleReference: rawItem['Sale Reference'] || rawItem['saleReference'] || '',
            calculatedLocation: rawItem['Calculated Location'] || rawItem['calculatedLocation'] || '',
            cleanedProduct: rawItem['Cleaned Product'] || rawItem['cleanedProduct'] || '',
            cleanedCategory: rawItem['Cleaned Category'] || rawItem['cleanedCategory'] || '',
            
            // Calculate derived fields
            netRevenue: parseNumericValue(rawItem['Payment Value'] || rawItem['paymentValue'] || 0) - parseNumericValue(rawItem['Payment VAT'] || rawItem['paymentVAT'] || 0),
            vat: parseNumericValue(rawItem['Payment VAT'] || rawItem['paymentVAT'] || 0),
            grossRevenue: parseNumericValue(rawItem['Payment Value'] || rawItem['paymentValue'] || 0),
            
            // Handle discount columns with multiple possible names
            mrpPreTax: parseNumericValue(
              rawItem['Mrp - Pre Tax'] || rawItem['MRP Pre Tax'] || rawItem['MRP_Pre_Tax'] || 
              rawItem['mrpPreTax'] || rawItem['MrpPreTax'] || rawItem['Pre Tax MRP'] || 0
            ),
            mrpPostTax: parseNumericValue(
              rawItem['Mrp - Post Tax'] || rawItem['MRP Post Tax'] || rawItem['MRP_Post_Tax'] || 
              rawItem['mrpPostTax'] || rawItem['MrpPostTax'] || rawItem['Post Tax MRP'] || 0
            ),
            discountAmount: parseNumericValue(
              rawItem['Discount Amount -Mrp- Payment Value'] || rawItem['Discount Amount'] || 
              rawItem['discount_amount'] || rawItem['discountAmount'] || rawItem['DiscountAmount'] ||
              rawItem['Discount_Amount'] || rawItem['Total Discount'] || 0
            ),
            discountPercentage: parseNumericValue(
              rawItem['Discount Percentage - discount amount/mrp*100'] || rawItem['Discount Percentage'] || 
              rawItem['discount_percentage'] || rawItem['discountPercentage'] || rawItem['DiscountPercentage'] ||
              rawItem['Discount_Percentage'] || rawItem['Discount %'] || rawItem['Discount_Percent'] || 0
            ),
            hostId: rawItem['Host Id'] || rawItem['Host ID'] || rawItem['hostId'] || '',
            // Secondary (Sec.) fields for behavior analytics
            secMembershipStartDate: rawItem['Sec. Membership Start Date'] || rawItem['Sec Membership Start Date'] || '',
            secMembershipEndDate: rawItem['Sec. Membership End Date'] || rawItem['Sec Membership End Date'] || '',
            secMembershipTotalClasses: parseNumericValue(rawItem['Sec. Membership Total Classes'] || 0),
            secMembershipClassesLeft: parseNumericValue(rawItem['Sec. Membership Classes Left'] || 0),
            secMembershipUsedSessions: parseNumericValue(rawItem['Sec. Total Used Sessions'] || rawItem['Sec. Membership Used Sessions'] || 0)
          };

          // Compute fallback discount metrics when missing
          const mrp = transformedItem.mrpPostTax && transformedItem.mrpPostTax > 0
            ? transformedItem.mrpPostTax
            : (transformedItem.mrpPreTax || 0);

          // Fallback: derive discountAmount from MRP vs payment when column is missing/0
          if ((transformedItem.discountAmount || 0) <= 0 && mrp > 0 && (transformedItem.paymentValue || 0) > 0 && mrp > (transformedItem.paymentValue || 0)) {
            transformedItem.discountAmount = mrp - (transformedItem.paymentValue || 0);
          }

          // Additional fallback: if still 0 but explicit percentage exists, compute amount
          if ((transformedItem.discountAmount || 0) <= 0 && (transformedItem.discountPercentage || 0) > 0 && mrp > 0) {
            transformedItem.discountAmount = (mrp * (transformedItem.discountPercentage || 0)) / 100;
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
            }
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
        
        salesData.push(...batch);
      };

      // Process data in batches to avoid blocking the main thread
      const totalRows = rows.length - 1; // Exclude header
      for (let i = 1; i <= totalRows; i += batchSize) {
        const endIndex = Math.min(i + batchSize, totalRows + 1);
        
        // Use setTimeout to yield control back to the browser
        if (i > 1) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        processRowsBatch(i, endIndex);
      }

      console.log('Transformed sales data sample:', salesData.slice(0, 3));
      console.log('Sample discount data:', {
        discountAmount: salesData[0]?.discountAmount,
        discountPercentage: salesData[0]?.discountPercentage,
        mrpPreTax: salesData[0]?.mrpPreTax,
        mrpPostTax: salesData[0]?.mrpPostTax
      });
      
      setData(salesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  return { data, loading, error, refetch: fetchSalesData };
};
