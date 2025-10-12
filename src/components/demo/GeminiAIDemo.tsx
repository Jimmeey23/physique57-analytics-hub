import React, { useState } from 'react';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { geminiService } from '@/services/geminiService';
import { directGeminiService } from '@/services/directGeminiService';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

// Sample data for testing
const demoTableData = [
  {
    category: 'Barre Classes',
    totalRevenue: 45000,
    totalSessions: 150,
    avgAttendance: 12,
    fillRate: 85,
    memberCount: 280
  },
  {
    category: 'Power Cycle',
    totalRevenue: 38000,
    totalSessions: 120,
    avgAttendance: 18,
    fillRate: 90,
    memberCount: 245
  },
  {
    category: 'Strength Training',
    totalRevenue: 22000,
    totalSessions: 80,
    avgAttendance: 8,
    fillRate: 75,
    memberCount: 180
  },
  {
    category: 'Yoga & Wellness',
    totalRevenue: 15000,
    totalSessions: 60,
    avgAttendance: 15,
    fillRate: 88,
    memberCount: 150
  },
  {
    category: 'Personal Training',
    totalRevenue: 68000,
    totalSessions: 200,
    avgAttendance: 1,
    fillRate: 95,
    memberCount: 85
  }
];

const demoTableColumns = [
  { key: 'category', header: 'Class Category', type: 'text' as const },
  { key: 'totalRevenue', header: 'Total Revenue', type: 'currency' as const },
  { key: 'totalSessions', header: 'Total Sessions', type: 'number' as const },
  { key: 'avgAttendance', header: 'Avg Attendance', type: 'number' as const },
  { key: 'fillRate', header: 'Fill Rate (%)', type: 'percentage' as const },
  { key: 'memberCount', header: 'Active Members', type: 'number' as const }
];

export const GeminiAIDemo: React.FC = () => {
  const [connectionTest, setConnectionTest] = useState<{ 
    status: 'idle' | 'testing' | 'success' | 'error'; 
    message?: string; 
    service?: string;
  }>({ status: 'idle' });

  const testGeminiConnection = async (useDirect = false) => {
    setConnectionTest({ status: 'testing' });
    
    try {
      const service = useDirect ? directGeminiService : geminiService;
      const serviceName = useDirect ? 'Direct API' : 'SDK';
      
  const result = await (service as any).testConnection();
      if (result.success) {
        setConnectionTest({ 
          status: 'success', 
          message: `${serviceName}: Connected to ${result.model}`,
          service: serviceName
        });
      } else {
        setConnectionTest({ 
          status: 'error', 
          message: `${serviceName}: ${result.error || 'Connection failed'}`,
          service: serviceName
        });
      }
    } catch (error) {
      setConnectionTest({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-slate-800">Gemini AI Table Analysis Demo</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          This demo showcases how Gemini AI can automatically analyze table data and generate 
          comprehensive insights, trends, and recommendations in the footer notes section.
        </p>
        
        {/* Connection Test */}
        <div className="flex flex-col items-center justify-center gap-3 mt-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => testGeminiConnection(false)}
              disabled={connectionTest.status === 'testing'}
              variant="outline"
              size="sm"
            >
              {connectionTest.status === 'testing' && <BrandSpinner size="xs" className="mr-2" />}
              Test SDK Connection
            </Button>
            
            <Button 
              onClick={() => testGeminiConnection(true)}
              disabled={connectionTest.status === 'testing'}
              variant="outline"
              size="sm"
            >
              {connectionTest.status === 'testing' && <BrandSpinner size="xs" className="mr-2" />}
              <Zap className="w-4 h-4 mr-1" />
              Test Direct API
            </Button>
          </div>
          
          {connectionTest.status === 'success' && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              {connectionTest.message}
            </Badge>
          )}
          
          {connectionTest.status === 'error' && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              {connectionTest.message}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Fitness Studio Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Category</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Total Sessions</TableHead>
                  <TableHead className="text-right">Avg Attendance</TableHead>
                  <TableHead className="text-right">Fill Rate (%)</TableHead>
                  <TableHead className="text-right">Active Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoTableData.map((row, index) => (
                  <TableRow key={index} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{row.category}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.totalSessions)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.avgAttendance)}</TableCell>
                    <TableCell className="text-right">{row.fillRate}%</TableCell>
                    <TableCell className="text-right">{formatNumber(row.memberCount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Summary Row */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Total Revenue:</span>
                <div className="font-semibold">{formatCurrency(demoTableData.reduce((sum, row) => sum + row.totalRevenue, 0))}</div>
              </div>
              <div>
                <span className="text-slate-600">Total Sessions:</span>
                <div className="font-semibold">{formatNumber(demoTableData.reduce((sum, row) => sum + row.totalSessions, 0))}</div>
              </div>
              <div>
                <span className="text-slate-600">Avg Fill Rate:</span>
                <div className="font-semibold">{(demoTableData.reduce((sum, row) => sum + row.fillRate, 0) / demoTableData.length).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-slate-600">Total Members:</span>
                <div className="font-semibold">{formatNumber(demoTableData.reduce((sum, row) => sum + row.memberCount, 0))}</div>
              </div>
              <div>
                <span className="text-slate-600">Revenue/Session:</span>
                <div className="font-semibold">
                  {formatCurrency(
                    demoTableData.reduce((sum, row) => sum + row.totalRevenue, 0) / 
                    demoTableData.reduce((sum, row) => sum + row.totalSessions, 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Powered Footer */}
      <PersistentTableFooter
        tableId="gemini-ai-demo-table"
        initialText=""
        tableData={demoTableData}
        tableColumns={demoTableColumns}
        tableName="Fitness Studio Performance Analysis"
        tableContext="Comprehensive performance analysis of different class categories including revenue, attendance, and member engagement metrics for a fitness studio"
        className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50"
      />

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-800 mb-3">🤖 How to Use AI Analysis</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">1.</span>
              <span>Click "Edit Notes" in the footer section below</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">2.</span>
              <span>Click "Quick AI Insights" for fast analysis or "Full AI Analysis" for comprehensive insights</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">3.</span>
              <span>Review the AI-generated summary, insights, trends, and recommendations</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">4.</span>
              <span>Click "Insert to Notes" to add the AI analysis to your notes</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">5.</span>
              <span>Edit, format, or add additional observations and save your analysis</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/60 rounded border border-purple-200">
            <p className="text-xs text-slate-600">
              <strong>Note:</strong> The AI will analyze the table data above to identify patterns, 
              trends, performance insights, and provide actionable recommendations for your fitness studio operations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};