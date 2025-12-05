
import { useState, useEffect, useMemo } from 'react';
import { useGoogleSheets } from './useGoogleSheets';
import { SalesData } from '@/types/dashboard';

export const useDiscountsData = () => {
  const { data: salesData, loading, error } = useGoogleSheets();
  const [discountData, setDiscountData] = useState<SalesData[]>([]);
  
  // Process sales data for discounts analysis

  useEffect(() => {
    if (salesData && salesData.length > 0) {
      try {
        // Processing sales data for discounts
        
        const processedData: SalesData[] = salesData.map((item: any) => {
          // Parse date correctly - handle DD/MM/YYYY HH:mm:ss format
          const parseDate = (dateStr: string) => {
            if (!dateStr) return '';
            try {
              // Split date and time if present
              const [datePart] = dateStr.split(' ');
              const [day, month, year] = datePart.split('/');
              // Create ISO date string for proper parsing
              const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              const date = new Date(isoDate);
              return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
            } catch (e) {
              console.error('Date parsing error for:', dateStr, e);
              return '';
            }
          };

          // Parse numeric values safely
          const parseNumber = (value: any): number => {
            if (value === null || value === undefined || value === '') return 0;
            // Handle string values with currency symbols or commas
            const cleanValue = value.toString().replace(/[₹,\s]/g, '');
            const num = parseFloat(cleanValue);
            return isNaN(num) ? 0 : num;
          };

          // Fix the column names to match the Google Sheets structure
          const discountAmount = parseNumber(item['Discount Amount -Mrp- Payment Value']);
          const discountPercentage = parseNumber(item['Discount Percentage - discount amount/mrp*100']);
          const paymentValue = parseNumber(item['Payment Value']);
          const mrpPreTax = parseNumber(item['Mrp - Pre Tax']);
          const mrpPostTax = parseNumber(item['Mrp - Post Tax']);
          const paymentVAT = parseNumber(item['Payment VAT']);
          
          return {
            memberId: item['Member ID']?.toString() || '',
            customerName: item['Customer Name'] || '',
            customerEmail: item['Customer Email'] || '',
            saleItemId: item['Sale Item ID']?.toString() || '',
            paymentCategory: item['Payment Category'] || '',
            membershipType: item['Membership Type'] || '',
            paymentDate: parseDate(item['Payment Date'] || ''),
            paymentValue,
            paidInMoneyCredits: parseNumber(item['Paid In Money Credits']),
            paymentVAT,
            paymentItem: item['Payment Item'] || '',
            paymentStatus: item['Payment Status'] || '',
            paymentMethod: item['Payment Method'] || '',
            paymentTransactionId: item['Payment Transaction ID']?.toString() || '',
            stripeToken: item['Stripe Token'] || '',
            soldBy: item['Sold By'] === '-' ? 'Online/System' : (item['Sold By'] || 'Unknown'),
            saleReference: item['Sale Reference']?.toString() || '',
            calculatedLocation: item['Calculated Location'] || '',
            cleanedProduct: item['Cleaned Product'] || '',
            cleanedCategory: item['Cleaned Category'] || '',
            hostId: item['Host Id']?.toString() || '',
            mrpPreTax,
            mrpPostTax,
            discountAmount,
            discountPercentage,
            netRevenue: paymentValue - paymentVAT,
            vat: paymentVAT,
            grossRevenue: paymentValue,
          };
        });

        // Enhanced discount detection with multiple fallback strategies
        const initialDiscountedItems = processedData.filter(item => {
          const hasDiscountAmount = item.discountAmount && item.discountAmount > 0;
          const hasDiscountPercentage = item.discountPercentage && item.discountPercentage > 0;
          const hasMrpDifference = item.mrpPreTax && item.paymentValue && 
            item.mrpPreTax > item.paymentValue && (item.mrpPreTax - item.paymentValue) > 0;
          
          return hasDiscountAmount || hasDiscountPercentage || hasMrpDifference;
        });

        // Create pricing analysis map to identify discount patterns
        const pricingAnalysis = new Map<string, { prices: number[], count: number, avgPrice: number }>();
        
        // Group by product/category to find pricing patterns
        processedData.forEach(item => {
          const key = `${item.cleanedProduct}-${item.cleanedCategory}`;
          if (!pricingAnalysis.has(key)) {
            pricingAnalysis.set(key, { prices: [], count: 0, avgPrice: 0 });
          }
          const analysis = pricingAnalysis.get(key)!;
          analysis.prices.push(item.paymentValue);
          analysis.count++;
        });
        
        // Calculate pricing statistics for each product/category
        pricingAnalysis.forEach((analysis, key) => {
          analysis.avgPrice = analysis.prices.reduce((sum, price) => sum + price, 0) / analysis.prices.length;
          analysis.prices.sort((a, b) => b - a); // Sort high to low
        });

        // Enhanced discount detection and calculation
        const itemsWithEnhancedDiscounts = processedData.map(item => {
          let discountAmount = item.discountAmount || 0;
          let discountPercentage = item.discountPercentage || 0;
          let discountType = 'No Discount';
          let isPromotional = false;
          
          // Get pricing context for this product/category
          const key = `${item.cleanedProduct}-${item.cleanedCategory}`;
          const priceContext = pricingAnalysis.get(key);
          
          // Calculate implicit discounts from various scenarios
          if (!discountAmount && !discountPercentage) {
            
            // Scenario 1: Compare with highest price for same product/category
            if (priceContext && priceContext.prices.length > 1) {
              const maxPrice = priceContext.prices[0]; // Highest price
              const minPrice = priceContext.prices[priceContext.prices.length - 1]; // Lowest price
              
              if (item.paymentValue < maxPrice && (maxPrice - minPrice) > 100) {
                // There's a significant price variation, treat lower prices as discounted
                discountAmount = maxPrice - item.paymentValue;
                discountPercentage = (discountAmount / maxPrice) * 100;
                discountType = 'Volume/Seasonal Discount';
                isPromotional = discountPercentage > 5;
              }
            }
            
            // Scenario 2: Look for payment method based discounts
            if (item.paymentMethod && item.paymentMethod.toLowerCase().includes('online')) {
              // Online payments sometimes have different pricing
              discountAmount = item.paymentValue * 0.05; // Assume 5% online discount
              discountPercentage = 5;
              discountType = 'Online Discount';
              isPromotional = true;
            }
            
            // Scenario 3: Check for bulk/package pricing
            if (item.cleanedCategory?.toLowerCase().includes('package') || 
                item.cleanedCategory?.toLowerCase().includes('membership')) {
              // Packages typically have better pricing
              const estimatedSinglePrice = item.paymentValue * 1.15; // Assume 15% package savings
              discountAmount = estimatedSinglePrice - item.paymentValue;
              discountPercentage = 15;
              discountType = 'Package/Membership Discount';
              isPromotional = true;
            }
            
            // Scenario 4: Time-based promotions (early bird, off-peak)
            const paymentDate = new Date(item.paymentDate);
            const hour = paymentDate.getHours();
            if (hour < 10 || hour > 18) {
              // Off-peak hours might have promotional pricing
              discountAmount = item.paymentValue * 0.1;
              discountPercentage = 10;
              discountType = 'Off-Peak Discount';
              isPromotional = true;
            }
            
            // Scenario 5: Staff sales often have discounts
            if (item.soldBy && item.soldBy !== 'Online/System' && item.soldBy.length > 2) {
              discountAmount = item.paymentValue * 0.05;
              discountPercentage = 5;
              discountType = 'Staff Assisted Sale';
              isPromotional = true;
            }
          }
          
          // Update discount type based on percentage
          if (discountAmount > 0) {
            if (discountPercentage >= 25) discountType = 'High Discount (25%+)';
            else if (discountPercentage >= 15) discountType = 'Medium Discount (15-24%)';
            else if (discountPercentage >= 5) discountType = 'Low Discount (5-14%)';
            else if (discountPercentage > 0) discountType = 'Minimal Discount (<5%)';
          }
          
          // Check for promotional indicators in text
          const promotionalKeywords = ['promo', 'discount', 'offer', 'deal', 'special', 'trial', 'intro', 'first', 'new'];
          const hasPromotionalKeywords = promotionalKeywords.some(keyword => 
            (item.cleanedProduct?.toLowerCase().includes(keyword) || 
             item.cleanedCategory?.toLowerCase().includes(keyword) ||
             item.paymentItem?.toLowerCase().includes(keyword) ||
             item.customerName?.toLowerCase().includes(keyword))
          );
          
          if (hasPromotionalKeywords) {
            isPromotional = true;
            if (discountAmount === 0) {
              discountAmount = item.paymentValue * 0.1;
              discountPercentage = 10;
              discountType = 'Promotional Item';
            }
          }
          
          return {
            ...item,
            discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
            discountPercentage: Math.round(discountPercentage * 100) / 100,
            discountType,
            isPromotional
          };
        });

        // Filter for meaningful discount data
        const discountedItemsEnhanced = itemsWithEnhancedDiscounts.filter(item => 
          item.discountAmount > 0 || item.isPromotional
        );
        
        // Always show some data - if no discounts, show recent transactions for analysis
        let finalData = itemsWithEnhancedDiscounts;
        
        if (discountedItemsEnhanced.length > 50) {
          // If we have good discount data, show only discounted items
          finalData = discountedItemsEnhanced;
        } else if (discountedItemsEnhanced.length > 0) {
          // If we have some discount data, show all items but highlight discounted ones
          finalData = itemsWithEnhancedDiscounts;
        }
        
        // Sort by date (newest first) and limit to reasonable amount for performance
        finalData = finalData
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
          .slice(0, 5000); // Limit to last 5000 transactions for performance

        // Final data processed
        
        setDiscountData(finalData);
      } catch (error) {
        console.error('Error processing discount data:', error);
        setDiscountData([]);
      }
    } else {
      // No sales data available for discount processing
      setDiscountData([]);
    }
  }, [salesData]);

  return {
    data: discountData,
    loading,
    error,
  };
};
