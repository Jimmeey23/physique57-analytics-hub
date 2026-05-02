import React, { useMemo } from 'react';
import { SessionData, SalesData, NewClientData } from '@/types/dashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  sessions: SessionData[];
  sales: SalesData[];
  newClients: NewClientData[];
}

interface ValidationIssue {
  id: string;
  type: 'error' | 'warning';
  category: string;
  message: string;
  itemIdentifier?: string;
  details?: string;
}

export const DataValidationPanel: React.FC<Props> = ({ sessions, sales, newClients }) => {
  const issues = useMemo(() => {
    const results: ValidationIssue[] = [];

    // --- Sessions Validation ---
    sessions.forEach((s, idx) => {
      const sessionId = s.sessionId || `row-${idx}`;
      
      // Error: checkedInCount > capacity
      if (s.checkedInCount > s.capacity && s.capacity > 0) {
        results.push({
          id: `session-cap-${sessionId}`,
          type: 'error',
          category: 'Sessions',
          message: 'Attendance exceeds capacity',
          itemIdentifier: s.cleanedClass || s.classType,
          details: `Session on ${s.date} at ${s.time} has ${s.checkedInCount} checked in but capacity is ${s.capacity}.`
        });
      }

      // Error: capacity = 0 (might cause division by zero in metrics)
      if (s.capacity === 0) {
        results.push({
          id: `session-zero-cap-${sessionId}`,
          type: 'warning',
          category: 'Sessions',
          message: 'Zero capacity defined',
          itemIdentifier: s.cleanedClass || s.classType,
          details: `Session on ${s.date} at ${s.time} has 0 capacity. Fill rate will be 0%.`
        });
      }

      // Warning: missing instructor
      if (!s.instructor || s.instructor.trim() === '') {
        results.push({
          id: `session-no-trainer-${sessionId}`,
          type: 'warning',
          category: 'Sessions',
          message: 'Missing instructor name',
          itemIdentifier: s.cleanedClass || s.classType,
          details: `Session on ${s.date} at ${s.time} has no instructor assigned.`
        });
      }

      // Error: invalid date
      if (!s.date || isNaN(Date.parse(s.date))) {
        results.push({
          id: `session-inv-date-${sessionId}`,
          type: 'error',
          category: 'Sessions',
          message: 'Invalid date format',
          itemIdentifier: sessionId,
          details: `Found invalid date value: "${s.date}"`
        });
      }
    });

    // --- Sales Validation ---
    sales.forEach((s, idx) => {
      const saleId = s.paymentTransactionId || s.transactionId || `row-${idx}`;

      // Error: paymentValue <= 0
      if (s.paymentValue <= 0) {
        results.push({
          id: `sales-zero-val-${saleId}`,
          type: 'warning',
          category: 'Sales',
          message: 'Non-positive payment value',
          itemIdentifier: s.customerName,
          details: `Transaction for ${s.paymentItem} has value ${s.paymentValue}.`
        });
      }

      // Warning: missing customerName
      if (!s.customerName || s.customerName.trim() === '') {
        results.push({
          id: `sales-no-cust-${saleId}`,
          type: 'error',
          category: 'Sales',
          message: 'Missing customer name',
          itemIdentifier: saleId,
          details: `A sale of ${s.paymentItem} on ${s.paymentDate} is missing a customer name.`
        });
      }

      // Error: invalid paymentDate
      if (!s.paymentDate || isNaN(Date.parse(s.paymentDate))) {
        results.push({
          id: `sales-inv-date-${saleId}`,
          type: 'error',
          category: 'Sales',
          message: 'Invalid payment date',
          itemIdentifier: s.customerName,
          details: `Found invalid date: "${s.paymentDate}"`
        });
      }
    });

    // --- New Clients Validation ---
    newClients.forEach((c, idx) => {
      const clientId = c.memberId || `row-${idx}`;

      // Error: missing memberId
      if (!c.memberId || c.memberId.trim() === '') {
        results.push({
          id: `nc-no-id-${idx}`,
          type: 'error',
          category: 'New Clients',
          message: 'Missing member ID',
          itemIdentifier: `${c.firstName} ${c.lastName}`,
          details: `A new client record is missing a member ID.`
        });
      }

      // Error: missing member name (both first and last)
      if ((!c.firstName || c.firstName.trim() === '') && (!c.lastName || c.lastName.trim() === '')) {
        results.push({
          id: `nc-no-name-${clientId}`,
          type: 'error',
          category: 'New Clients',
          message: 'Missing client name',
          itemIdentifier: clientId,
          details: `Client with ID ${clientId} has no name provided.`
        });
      }

      // Error: missing firstVisitDate
      if (!c.firstVisitDate || isNaN(Date.parse(c.firstVisitDate))) {
        results.push({
          id: `nc-no-fv-date-${clientId}`,
          type: 'error',
          category: 'New Clients',
          message: 'Missing or invalid first visit date',
          itemIdentifier: `${c.firstName} ${c.lastName}`,
          details: `Client ${clientId} has invalid first visit date: "${c.firstVisitDate}"`
        });
      }
    });

    return results;
  }, [sessions, sales, newClients]);

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, ValidationIssue[]>);

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Data Validation Results
          </CardTitle>
          <div className="flex gap-2">
            {errorCount > 0 && (
              <Badge variant="destructive" className="flex gap-1 animate-pulse">
                <XCircle className="h-3 w-3" /> {errorCount} Errors
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex gap-1">
                <AlertTriangle className="h-3 w-3" /> {warningCount} Warnings
              </Badge>
            )}
            {issues.length === 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1">
                <CheckCircle2 className="h-3 w-3" /> Data Valid
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {issues.length === 0 
            ? "No data quality issues found across the loaded datasets."
            : `${issues.length} issues found that may impact reporting accuracy.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {issues.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="multiple" defaultValue={Object.keys(groupedIssues)} className="space-y-4">
              {Object.entries(groupedIssues).map(([category, catIssues]) => (
                <AccordionItem key={category} value={category} className="border rounded-lg px-4 bg-white shadow-sm overflow-hidden">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{category}</span>
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {catIssues.length} issues
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-3">
                    {catIssues.map((issue) => (
                      <div key={issue.id} className={cn(
                        "p-3 rounded-md border-l-4 flex gap-3",
                        issue.type === 'error' 
                          ? "bg-red-50 border-red-200 border-l-red-500" 
                          : "bg-amber-50 border-amber-200 border-l-amber-500"
                      )}>
                        <div className="mt-0.5">
                          {issue.type === 'error' 
                            ? <XCircle className="h-4 w-4 text-red-500" /> 
                            : <AlertTriangle className="h-4 w-4 text-amber-500" />
                          }
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{issue.message}</span>
                            {issue.itemIdentifier && (
                              <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded border border-current opacity-60">
                                {issue.itemIdentifier}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {issue.details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-green-50/30 rounded-xl border border-dashed border-green-200">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-green-900">Your data looks great!</h3>
            <p className="text-sm text-green-700 max-w-xs mx-auto mt-2">
              We've scanned all loaded records and found no critical validation errors or warnings.
            </p>
          </div>
        )}
        
        <div className="mt-6 p-4 rounded-lg bg-blue-50/50 border border-blue-100 flex gap-3">
          <Info className="h-5 w-5 text-blue-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-blue-900">About Data Validation</h4>
            <p className="text-[11px] text-blue-700 leading-normal">
              This panel performs sanity checks on the raw data files. Errors (red) indicate missing or corrupted data that will break certain charts or metrics. Warnings (amber) indicate missing optional fields or unusual values that might need attention.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
