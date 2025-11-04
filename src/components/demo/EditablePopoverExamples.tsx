/**
 * Example Usage of Editable Info Popovers
 * 
 * This file demonstrates how to use the editable popover system
 * across different components and contexts.
 */

import React from 'react';
import { InfoPopover } from '@/components/ui/InfoPopover';
import { EditableInfoPopover } from '@/components/ui/EditableInfoPopover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const EditablePopoverExamples = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Editable Info Popover Examples</h1>
        <p className="text-gray-600">
          Click on any info icon to view content. Click "Customize This Content" to edit and save to Google Drive.
        </p>
      </div>

      {/* Example 1: Sales Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Sales Metrics
            <InfoPopover 
              context="sales-metrics" 
              locationId="kwality" 
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Total Revenue: ₹25.2L | Growth: +19% MoM
          </p>
        </CardContent>
      </Card>

      {/* Example 2: Sales Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Sales Overview - Supreme HQ
            <InfoPopover 
              context="sales-overview" 
              locationId="supreme" 
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Performance overview for Supreme HQ location
          </p>
        </CardContent>
      </Card>

      {/* Example 3: Product Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Product Performance
            <InfoPopover 
              context="sales-product" 
              locationId="all" 
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Product-level insights and recommendations
          </p>
        </CardContent>
      </Card>

      {/* Example 4: Standalone Editable Popover */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Custom Section (Standalone Component)
            <EditableInfoPopover 
              context="sales-customer" 
              locationId="kenkere"
              defaultContent={[
                'Revenue per unique member: ₹1,528',
                'Higher newcomer months precede stronger revenue',
                'Average engagement varies by membership type'
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            This uses the standalone EditableInfoPopover component
          </p>
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Basic Usage:</h3>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<InfoPopover 
  context="sales-metrics" 
  locationId="kwality" 
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">With Custom Default Content:</h3>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<EditableInfoPopover 
  context="sales-customer" 
  locationId="supreme"
  defaultContent={[
    'Custom insight 1',
    'Custom insight 2'
  ]}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Available Contexts:</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li><code>sales-metrics</code> - Sales metrics overview</li>
              <li><code>sales-top-bottom</code> - Top/bottom performers</li>
              <li><code>sales-mom</code> - Month-over-month analysis</li>
              <li><code>sales-yoy</code> - Year-over-year analysis</li>
              <li><code>sales-product</code> - Product insights</li>
              <li><code>sales-category</code> - Category breakdown</li>
              <li><code>sales-soldby</code> - Sales rep performance</li>
              <li><code>sales-payment</code> - Payment methods</li>
              <li><code>sales-customer</code> - Customer behavior</li>
              <li><code>sales-deep-insights</code> - Deep dive analysis</li>
              <li><code>sales-overview</code> - Location overview</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Available Locations:</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li><code>kwality</code> - Kwality House, Kemps Corner</li>
              <li><code>supreme</code> - Supreme HQ, Bandra</li>
              <li><code>kenkere</code> - Kenkere House, Bengaluru</li>
              <li><code>all</code> - All Locations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle>✨ Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Persistent Storage:</strong> All edits saved to Google Drive</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Visual Indicators:</strong> Green dot shows when custom content is active</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>HTML Support:</strong> Use HTML formatting in custom content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Restore Defaults:</strong> Easy rollback to original content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Location-Specific:</strong> Different content per location</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Context-Aware:</strong> Different content per section</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditablePopoverExamples;
