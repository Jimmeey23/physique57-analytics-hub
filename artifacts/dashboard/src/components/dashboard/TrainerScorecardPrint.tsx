
import * as React from "react";
import { createPortal } from "react-dom";
import { SessionData, SalesData } from "@/types/dashboard";
import { formatCurrency, formatNumber, formatPercentage } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { PrinterIcon } from "lucide-react";

interface TrainerScorecardProps {
  trainerName: string;
  sessions: SessionData[];
  sales: SalesData[];
  period: string;
}

export const TrainerScorecardPrint: React.FC<TrainerScorecardProps> = ({
  trainerName,
  sessions,
  sales,
  period
}) => {
  // Simple calculations for the scorecard
  const trainerSessions = sessions.filter(s => s.instructor === trainerName);
  const totalSessions = trainerSessions.length;
  
  const avgFillRate = totalSessions > 0 
    ? trainerSessions.reduce((acc, curr) => acc + (curr.fillPercentage || 0), 0) / totalSessions
    : 0;

  const totalAttendees = trainerSessions.reduce((acc, curr) => acc + (curr.checkedInCount || 0), 0);
  
  // Estimate revenue - for actual attribution we'd need more complex mapping
  // but for the scorecard we'll use a simplified version
  const estimatedRevenue = trainerSessions.reduce((acc, curr) => {
    // If sessions have a totalPaid field, use it, otherwise use a placeholder
    return acc + ((curr as any).totalPaid || 0);
  }, 0);

  const uniqueMembers = new Set(trainerSessions.flatMap(s => (s as any).memberIds || [])).size;

  return (
    <div className="trainer-scorecard-print p-8 bg-white text-slate-900 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .trainer-scorecard-print, .trainer-scorecard-print * { visibility: visible; }
          .trainer-scorecard-print { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            padding: 20mm;
          }
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
        }
        .scorecard-header { border-bottom: 2px solid #0f172a; padding-bottom: 1rem; margin-bottom: 2rem; }
        .scorecard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
        .metric-box { border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.5rem; }
        .metric-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
        .metric-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem; }
        .scorecard-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .scorecard-table th { text-align: left; padding: 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; color: #64748b; }
        .scorecard-table td { padding: 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; }
        .recommendation-box { background: #f8fafc; padding: 1.5rem; border-radius: 0.75rem; margin-top: 3rem; }
      `}} />

      <header className="scorecard-header flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trainer Scorecard</h1>
          <p className="text-slate-500 font-medium">{trainerName} • {period}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-blue-600">Physique 57 India</p>
          <p className="text-xs text-slate-400">Analytics Dashboard Report</p>
        </div>
      </header>

      <div className="scorecard-grid">
        <div className="metric-box">
          <p className="metric-label">Sessions Taught</p>
          <p className="metric-value">{totalSessions}</p>
        </div>
        <div className="metric-box">
          <p className="metric-label">Avg. Fill Rate</p>
          <p className="metric-value">{formatPercentage(avgFillRate)}</p>
        </div>
        <div className="metric-box">
          <p className="metric-label">Total Attendees</p>
          <p className="metric-value">{totalAttendees}</p>
        </div>
        <div className="metric-box">
          <p className="metric-label">Est. Revenue</p>
          <p className="metric-value">{formatCurrency(estimatedRevenue)}</p>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4 text-slate-800">Recent Class Performance</h2>
        <table className="scorecard-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Class Name</th>
              <th>Location</th>
              <th>Attendees</th>
              <th>Fill %</th>
            </tr>
          </thead>
          <tbody>
            {trainerSessions.slice(0, 10).map((s, i) => (
              <tr key={i}>
                <td className="font-medium">{s.date}</td>
                <td>{s.cleanedClass}</td>
                <td>{s.location}</td>
                <td>{s.checkedInCount}</td>
                <td className="font-bold">{formatPercentage(s.fillPercentage || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="recommendation-box">
        <h3 className="text-lg font-bold mb-2 text-slate-900">Performance Insights</h3>
        <p className="text-slate-600 leading-relaxed">
          Based on the performance data for {period}, {trainerName} is showing {avgFillRate > 75 ? 'exceptional' : avgFillRate > 50 ? 'solid' : 'improving'} fill rates. 
          {avgFillRate < 40 ? ' Focusing on increasing client engagement and encouraging re-bookings could help boost attendance.' : ' Keep up the great work in maintaining consistent attendance across all locations.'}
        </p>
      </div>

      <footer className="mt-12 pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
        <p>Report generated on {new Date().toLocaleDateString()}</p>
        <p>Confidential Trainer Performance Document</p>
      </footer>
    </div>
  );
};

export const PrintScorecardButton: React.FC<TrainerScorecardProps> = (props) => {
  const [isPrinting, setIsPrinting] = React.useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  return (
    <>
      <Button 
        onClick={handlePrint}
        variant="outline"
        size="sm"
        className="gap-2 border-slate-200 hover:bg-slate-50"
      >
        <PrinterIcon className="w-4 h-4" />
        Print Scorecard
      </Button>
      {isPrinting && createPortal(
        <TrainerScorecardPrint {...props} />,
        document.body
      )}
    </>
  );
};
