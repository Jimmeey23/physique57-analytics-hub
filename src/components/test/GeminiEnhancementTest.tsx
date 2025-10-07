import React, { useState } from 'react';
import { geminiService } from '../../services/geminiService';

interface TestData {
  month: string;
  revenue: number;
  customers: number;
  avgOrder: number;
}

// Generate realistic sample data with current date context
const generateSampleData = (): TestData[] => {
  const currentDate = new Date();
  const months = [];
  
  // Generate last 6 months of data
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = monthDate.toLocaleString('default', { month: 'long' });
    const baseRevenue = 500000 + (Math.random() * 300000);
    const baseCustomers = 120 + Math.floor(Math.random() * 50);
    
    months.push({
      month: monthName,
      revenue: Math.floor(baseRevenue),
      customers: baseCustomers,
      avgOrder: Math.floor(baseRevenue / baseCustomers),
    });
  }
  
  return months;
};

const sampleData: TestData[] = generateSampleData();

export default function GeminiEnhancementTest() {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testEnhancedAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const result = await geminiService.generateTableSummary({
        tableData: sampleData,
        tableName: 'Monthly Revenue Performance',
        columns: [
          { key: 'month', header: 'Month', type: 'text' },
          { key: 'revenue', header: 'Revenue', type: 'currency' },
          { key: 'customers', header: 'Customers', type: 'number' },
          { key: 'avgOrder', header: 'Average Order', type: 'currency' },
        ]
      });

      setAnalysis(result.summary || 'No analysis generated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  const testCurrencyFormatting = () => {
    const testAmounts = [545000, 1200000, 2500000, 10000000];
    return testAmounts.map(amount => 
      geminiService.formatCurrency(amount)
    ).join(', ');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Previous Month Performance Analysis Test</h1>
      <div className="bg-yellow-50 p-4 rounded-lg mb-6 border-l-4 border-yellow-400">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">📊 Focus: Previous Month Analysis</h2>
        <p className="text-yellow-700">
          This test validates that AI analysis focuses on <strong>{new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</strong> performance 
          compared to other months in the dataset.
        </p>
      </div>
      
      {/* Currency Formatting Test */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Currency Formatting Test</h2>
        <p className="text-gray-700 mb-2">
          Sample amounts: 545,000 | 1,200,000 | 2,500,000 | 10,000,000
        </p>
        <p className="text-lg font-mono bg-white p-2 rounded">
          Formatted: {testCurrencyFormatting()}
        </p>
      </div>

      {/* Sample Data Display */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Sample Data for Analysis</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Month</th>
                <th className="border p-2 text-right">Revenue (₹)</th>
                <th className="border p-2 text-right">Customers</th>
                <th className="border p-2 text-right">Avg Order (₹)</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((row, index) => (
                <tr key={index}>
                  <td className="border p-2">{row.month}</td>
                  <td className="border p-2 text-right">{geminiService.formatCurrency(row.revenue)}</td>
                  <td className="border p-2 text-right">{row.customers}</td>
                  <td className="border p-2 text-right">{geminiService.formatCurrency(row.avgOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Analysis Test */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Previous Month AI Analysis Test</h2>
        <button
          onClick={testEnhancedAnalysis}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Analyzing Previous Month...' : 'Test Previous Month Analysis'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
            Error: {error}
          </div>
        )}
        
        {analysis && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Generated Analysis:</h3>
            <div className="bg-white p-4 border rounded max-h-96 overflow-y-auto whitespace-pre-wrap">
              {analysis}
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Previous Month Analysis Features:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Previous Month Focus:</strong> Analysis centers on {new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleString('default', { month: 'long' })} performance</li>
          <li><strong>Month-over-Month Comparisons:</strong> Detailed percentage changes and growth metrics</li>
          <li><strong>Historical Ranking:</strong> How previous month ranks against all other months</li>
          <li><strong>INR Currency Formatting:</strong> All amounts displayed in lakhs (₹ format)</li>
          <li><strong>Trend Analysis:</strong> Previous month performance in context of broader patterns</li>
          <li><strong>Comprehensive Insights:</strong> 6-section detailed analysis with 8 key points</li>
          <li><strong>Enhanced Content:</strong> No truncation with 4096 token limit</li>
        </ul>
      </div>
    </div>
  );
}