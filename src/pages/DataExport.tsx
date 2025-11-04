/**
 * Data Export Page
 * Standalone page for the data export tool
 */

import React from 'react';
import { DataExportTool } from '@/components/dashboard/DataExportTool';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useDiscountsData } from '@/hooks/useDiscountsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/ui/footer';

const DataExport = () => {
  // Load all data sources
  const { data: salesData, loading: salesLoading } = useGoogleSheets();
  const { data: checkinsData, loading: checkinsLoading } = useCheckinsData();
  const { data: newClientData, loading: clientsLoading } = useNewClientData();
  const { data: payrollData, isLoading: payrollLoading } = usePayrollData();
  const { data: sessionsData } = useSessionsData();
  const { data: discountsData, loading: discountsLoading } = useDiscountsData();
  const { data: expirationsData, loading: expirationsLoading } = useExpirationsData();
  const { data: lateCancellationsData, loading: cancellationsLoading } = useLateCancellationsData();
  const { data: leadsData, loading: leadsLoading } = useLeadsData();

  const isLoading = 
    salesLoading || 
    checkinsLoading || 
    clientsLoading || 
    payrollLoading || 
    discountsLoading || 
    expirationsLoading || 
    cancellationsLoading || 
    leadsLoading;

  const dataSources = {
    salesData,
    checkinsData,
    newClientData,
    payrollData,
    sessionsData,
    discountsData,
    expirationsData,
    lateCancellationsData,
    leadsData,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Data Export Center
            </h1>
            <p className="text-lg text-gray-600">
              Export comprehensive analytics data across all locations and pages
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-lg text-gray-600">Loading data sources...</p>
              <p className="text-sm text-gray-500 mt-2">
                This may take a moment while we fetch all your analytics data
              </p>
            </div>
          ) : (
            <DataExportTool dataSources={dataSources} />
          )}

          {/* Feature Cards */}
          {!isLoading && (
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Comprehensive Export</h3>
                <p className="text-sm text-gray-600">
                  Export all tables and metrics from every page in your analytics dashboard
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Multiple Formats</h3>
                <p className="text-sm text-gray-600">
                  Choose from CSV, Excel, PDF, Text, or JSON formats for maximum flexibility
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Flexible Filtering</h3>
                <p className="text-sm text-gray-600">
                  Filter by specific pages, locations, and choose between tables or metrics
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};export default DataExport;
