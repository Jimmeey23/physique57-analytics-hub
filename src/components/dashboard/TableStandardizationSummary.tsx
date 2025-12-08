/**
 * TABLE STANDARDIZATION TEMPLATE - PHYSIQUE57 ANALYTICS HUB
 * 
 * This file documents the comprehensive table styling template that has been
 * applied across all tables in the Physique57 Analytics Hub application.
 * 
 * Created: December 7, 2025
 * Applied to: All table components across the entire application
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

/**
 * STANDARDIZED ROW HEIGHT
 * All table rows now use consistent 35px height (h-9 max-h-9)
 */
export const STANDARD_ROW_CLASSES = {
  category: "group bg-slate-100 border-b border-slate-400 font-semibold hover:bg-slate-200 transition-all duration-200 h-9 max-h-9 cursor-pointer",
  product: "bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-200 transition-all duration-300 hover:shadow-lg animate-in slide-in-from-left-2 fade-in duration-300 cursor-pointer h-9 max-h-9",
  standard: "bg-white hover:bg-slate-50 border-b border-gray-200 transition-all duration-200 h-9 max-h-9"
};

/**
 * STANDARDIZED FIRST COLUMN STYLING
 * All first columns use single-line text with ellipsis overflow
 */
export const STANDARD_FIRST_COLUMN_CLASSES = {
  category: "w-[30rem] px-4 py-2 text-left sticky left-0 bg-slate-100 group-hover:bg-slate-200 border-r border-slate-300 z-20 transition-all duration-300 shadow-sm whitespace-nowrap overflow-hidden text-ellipsis",
  product: "w-[30rem] px-6 py-2 text-left sticky left-0 bg-white border-r border-gray-200 z-10 transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis",
  standard: "w-80 px-4 py-2 text-left sticky left-0 bg-white hover:bg-slate-50 border-r border-gray-200 z-20 cursor-pointer transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis"
};

/**
 * STANDARDIZED HEADER STYLING
 * All table headers use gradient backgrounds with consistent typography
 */
export const STANDARD_HEADER_CLASSES = {
  main: "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800",
  subHeader: "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800",
  monthColumn: "px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-l border-white/20 min-w-[90px] cursor-pointer select-none",
  firstColumn: "w-[30rem] px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide sticky left-0 z-40 border-r border-white/20 cursor-pointer select-none"
};

/**
 * STANDARDIZED TABLE IDENTIFIERS
 * All tables include data-table attributes for export functionality
 */
export const STANDARD_TABLE_IDENTIFIERS = {
  yearOnYear: "year-on-year-analysis",
  productPerformance: "product-performance-analysis", 
  categoryPerformance: "category-performance-analysis",
  salesTeam: "sales-team-performance",
  customerBehavior: "customer-behavior-analysis",
  monthOnMonth: "month-on-month-analysis",
  trainer: "trainer-performance-analysis",
  class: "class-attendance-analysis"
};

/**
 * STANDARDIZED MAIN COLUMN HIGHLIGHTING
 * Previous month columns are highlighted with Star icons and blue backgrounds
 */
export const MAIN_COLUMN_HIGHLIGHT = {
  headerClass: "bg-blue-800 text-white",
  starIcon: "w-3 h-3",
  condition: "isPreviousMonth"
};

/**
 * LIST OF STANDARDIZED COMPONENTS
 * All these components now follow the unified template
 */
export const STANDARDIZED_COMPONENTS = [
  'EnhancedYearOnYearTableNew.tsx',
  'ProductPerformanceTableNew.tsx', 
  'CategoryPerformanceTableNew.tsx',
  'SoldByMonthOnMonthTableNew.tsx',
  'CustomerBehaviorMonthOnMonthTable.tsx',
  'MonthOnMonthTable.tsx',
  'MonthOnMonthTableNew.tsx',
  'MonthOnMonthTrainerTable.tsx',
  'MonthOnMonthClassTable.tsx',
  'FunnelMonthOnMonthTable.tsx',
  'DiscountMonthOnMonthTable.tsx',
  'EnhancedYearOnYearTable.tsx'
];

export const TableStandardizationSummary: React.FC = () => {
  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-6 h-6" />
          Table Standardization Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid gap-4">
          <div>
            <h3 className="font-bold text-lg mb-2">✅ Standardized Features Applied:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Badge variant="secondary">Row Height</Badge>
                Consistent 35px height across all tables (h-9 max-h-9)
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="secondary">First Column</Badge>
                Single-line text with ellipsis overflow (whitespace-nowrap)
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="secondary">Main Column</Badge>
                Previous month highlighting with Star icons
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="secondary">Export Ready</Badge>
                Table identifiers (data-table attributes) for export tools
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="secondary">Visual Consistency</Badge>
                Unified gradient backgrounds and hover effects
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-2">📊 Standardized Components ({STANDARDIZED_COMPONENTS.length}):</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {STANDARDIZED_COMPONENTS.map((component, index) => (
                <div key={index} className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="font-mono text-slate-700">{component}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              🎉 All tables across the Physique57 Analytics Hub now follow the unified design template!
            </p>
            <p className="text-green-700 text-sm mt-1">
              Development server running at <code>localhost:8082</code> with all changes applied.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TableStandardizationSummary;