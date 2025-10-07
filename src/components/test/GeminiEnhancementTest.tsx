import React, { useState } from 'react';
import { geminiService } from '../../services/geminiService';

interface TestData {
  month: string;
  revenue: number;
  customers: number;
  avgOrder: number;
}

const sampleData: TestData[] = [
  { month: 'January', revenue: 545000, customers: 125, avgOrder: 4360 },
  { month: 'February', revenue: 622000, customers: 142, avgOrder: 4380 },
  { month: 'March', revenue: 698000, customers: 158, avgOrder: 4418 },
  { month: 'April', revenue: 734000, customers: 165, avgOrder: 4448 },
];

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
      <h1 className="text-3xl font-bold mb-6">Gemini Enhancement Test</h1>
      
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
        <h2 className="text-xl font-semibold mb-3">Enhanced AI Analysis Test</h2>
        <button
          onClick={testEnhancedAnalysis}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Generating Analysis...' : 'Test Enhanced Analysis'}
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
        <h3 className="font-semibold mb-2">Enhancement Features Being Tested:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>INR currency formatting in lakhs instead of USD millions</li>
          <li>Increased content limits (1000 chars summary, 8 key insights)</li>
          <li>Enhanced analysis prompt with 6 detailed sections</li>
          <li>Improved content parsing with flexible regex patterns</li>
          <li>Higher token limits (4096) for detailed responses</li>
        </ul>
      </div>
    </div>
  );
}