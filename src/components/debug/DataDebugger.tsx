import React from 'react';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useDiscountsData } from '@/hooks/useDiscountsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const DataDebugger: React.FC = () => {
  const { data: salesData, loading: salesLoading, error: salesError } = useGoogleSheets();
  const { data: discountData, loading: discountLoading, error: discountError } = useDiscountsData();

  const handleTestAPICall = async () => {
    try {
      console.log('Testing API call directly...');
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/1sDPAX6OmGb48kL1pm0mhin2C9KD-Jykq8skJjNuQUNg/values/Sales?alt=json');
      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);
      
      if (!response.ok) {
        console.error('API call failed:', await response.text());
      } else {
        const data = await response.json();
        console.log('API call successful:', data);
      }
    } catch (error) {
      console.error('API call error:', error);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm">Data Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>
            <strong>Sales Data:</strong>
            <div>Loading: {salesLoading ? 'Yes' : 'No'}</div>
            <div>Error: {salesError || 'None'}</div>
            <div>Count: {salesData?.length || 0}</div>
          </div>
          
          <div>
            <strong>Discount Data:</strong>
            <div>Loading: {discountLoading ? 'Yes' : 'No'}</div>
            <div>Error: {discountError || 'None'}</div>
            <div>Count: {discountData?.length || 0}</div>
          </div>
          
          <Button 
            onClick={handleTestAPICall} 
            size="sm" 
            className="w-full mt-2"
          >
            Test API Call
          </Button>
          
          {salesData && salesData.length > 0 && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <strong>Sample Data:</strong>
              <pre className="overflow-auto max-h-32">
                {JSON.stringify(salesData[0], null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
