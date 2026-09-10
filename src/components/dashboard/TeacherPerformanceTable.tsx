import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Download, Image, UserCheck } from 'lucide-react';
import { P57TableShell } from '@/components/ui/P57TableShell';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useRegisterTableForCopy } from '@/hooks/useRegisterTableForCopy';
import { isConverted, isNewClient, isRetained } from '@/utils/clientRetention';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { conversionRate as calcConversionRate, retentionRate as calcRetentionRate } from '@/utils/retentionRates';
import { downloadCsvArray } from '@/utils/csvExport';

interface TeacherPerformanceTableProps {
  data: NewClientData[];
  onRowClick?: (rowData: any) => void;
}

interface TeacherStats {
  trainerName: string;
  newMembers: number;
  totalMembers: number;
  sessions: number;
  converted: number;
  conversionRate: number;
  retained: number;
  retentionRate: number;
}

export const TeacherPerformanceTable: React.FC<TeacherPerformanceTableProps> = ({
  data,
  onRowClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableTitle = 'Teacher Performance Analysis';
  const { getAllTabsText } = useRegisterTableForCopy(containerRef as any, tableTitle);
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');
  const [query, setQuery] = useState('');

  const teacherStats = useMemo(() => {
    const stats = new Map<string, {
      newMembers: Set<string>;
      totalMembers: Set<string>;
      sessions: number;
      converted: Set<string>;
      retained: Set<string>;
    }>();

    // Process data to calculate teacher statistics
    data.forEach(client => {
      const trainerName = client.trainerName || 'Unknown Trainer';
      
      if (!stats.has(trainerName)) {
        stats.set(trainerName, {
          newMembers: new Set(),
          totalMembers: new Set(),
          sessions: 0,
          converted: new Set(),
          retained: new Set()
        });
      }

      const trainerStats = stats.get(trainerName)!;
      
      // Track every member (rate denominators) + unique new members
      if (client.memberId) {
        trainerStats.totalMembers.add(client.memberId);
      }
      if (isNewClient(client) && client.memberId) {
        trainerStats.newMembers.add(client.memberId);
      }
      
      // Track sessions (visits)
      trainerStats.sessions += client.classNo || 0;
      
      // Track conversions
      if (isConverted(client) && client.memberId) {
        trainerStats.converted.add(client.memberId);
      }
      
      // Track retention
      if (isRetained(client) && client.memberId) {
        trainerStats.retained.add(client.memberId);
      }
    });

    // Convert to array and calculate rates
    const results: TeacherStats[] = Array.from(stats.entries()).map(([trainerName, stats]) => {
      const newMembers = stats.newMembers.size;
      const totalMembers = stats.totalMembers.size;
      const converted = stats.converted.size;
      const retained = stats.retained.size;
      
      return {
        trainerName,
        newMembers,
        totalMembers,
        sessions: stats.sessions,
        converted,
        conversionRate: calcConversionRate(converted, newMembers),
        retained,
        retentionRate: calcRetentionRate(retained, newMembers),
      };
    });

    // Sort by new members descending
    return results.sort((a, b) => b.newMembers - a.newMembers);
  }, [data]);

  // Sorting state
  const [sortField, setSortField] = useState<string | undefined>('newMembers');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedData = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term ? teacherStats.filter((t) => t.trainerName.toLowerCase().includes(term)) : teacherStats;
    if (!sortField) return [...base];
    const copy = [...base];
    copy.sort((a: any, b: any) => {
      const va = a[sortField as keyof TeacherStats];
      const vb = b[sortField as keyof TeacherStats];
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDirection === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = Number(va || 0);
      const nb = Number(vb || 0);
      return sortDirection === 'asc' ? na - nb : nb - na;
    });
    return copy;
  }, [teacherStats, sortField, sortDirection, query]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['Teacher Name', 'New Members', 'Sessions', 'Converted', 'Conversion Rate', 'Retained', 'Retention Rate'];
    const rows = sortedData.map(teacher => [
      teacher.trainerName,
      teacher.newMembers,
      teacher.sessions,
      teacher.converted,
      `${teacher.conversionRate.toFixed(1)}%`,
      teacher.retained,
      `${teacher.retentionRate.toFixed(1)}%`
    ]);
    rows.push([
      totals.trainerName,
      totals.newMembers,
      totals.sessions,
      totals.converted,
      `${totals.conversionRate.toFixed(1)}%`,
      totals.retained,
      `${totals.retentionRate.toFixed(1)}%`
    ]);
    downloadCsvArray('teacher-performance.csv', headers, rows);
  };

  const exportToPDF = async () => {
    if (!containerRef.current) return;

    // Render a full offscreen table (all rows + totals) with proper styling
    const offscreen = document.createElement('div');
    offscreen.style.position = 'absolute';
    offscreen.style.left = '-99999px';
    offscreen.style.top = '0';
    offscreen.style.background = '#ffffff';
    offscreen.style.padding = '20px';
    offscreen.style.color = '#000';
    offscreen.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    offscreen.style.fontSize = '14px';
    offscreen.style.width = '1200px';

    // Add title
    const title = document.createElement('h1');
    title.textContent = 'Teacher Performance Analysis';
    title.style.fontSize = '24px';
    title.style.fontWeight = '600';
    title.style.marginBottom = '20px';
    title.style.color = '#1f2937';
    title.style.textAlign = 'center';
    offscreen.appendChild(title);

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.background = '#ffffff';
    table.style.color = '#000';
    table.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    table.style.borderRadius = '8px';
    table.style.overflow = 'hidden';
    
    const thead = document.createElement('thead');
    thead.style.background = 'linear-gradient(to right, #334155, #1e293b, #4f46e5)';
    const headerRow = document.createElement('tr');
    ['Teacher Name','New Members','Sessions','Converted','Conversion Rate','Retained','Retention Rate'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      th.style.textAlign = 'center';
      th.style.padding = '12px 8px';
      th.style.border = '1px solid #e5e7eb';
      th.style.color = '#ffffff';
      th.style.fontWeight = '600';
      th.style.fontSize = '12px';
      th.style.textTransform = 'uppercase';
      th.style.letterSpacing = '0.05em';
      th.style.background = 'linear-gradient(to right, #334155, #1e293b, #4f46e5)';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    sortedData.forEach(r => {
      const tr = document.createElement('tr');
      [r.trainerName, r.newMembers, r.sessions, r.converted, `${r.conversionRate.toFixed(1)}%`, r.retained, `${r.retentionRate.toFixed(1)}%`].forEach(cell => {
        const td = document.createElement('td');
        td.textContent = String(cell);
        td.style.padding = '6px 8px';
        td.style.border = '1px solid #e5e7eb';
        td.style.height = '35px';
        td.style.whiteSpace = 'nowrap';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // totals row
    const trTotal = document.createElement('tr');
    trTotal.style.backgroundColor = '#f3f4f6';
    trTotal.style.borderTop = '2px solid #d1d5db';
    [totals.trainerName, totals.newMembers, totals.sessions, totals.converted, `${totals.conversionRate.toFixed(1)}%`, totals.retained, `${totals.retentionRate.toFixed(1)}%`].forEach((cell, cellIndex) => {
      const td = document.createElement('td');
      td.textContent = String(cell);
      td.style.padding = '12px 8px';
      td.style.border = '1px solid #d1d5db';
      td.style.fontWeight = '700';
      td.style.height = '40px';
      td.style.color = '#111827';
      td.style.fontSize = '14px';
      td.style.textAlign = cellIndex === 0 ? 'left' : 'center';
      td.style.backgroundColor = '#f9fafb';
      trTotal.appendChild(td);
    });
    tbody.appendChild(trTotal);
    table.appendChild(tbody);
    offscreen.appendChild(table);
    document.body.appendChild(offscreen);

    const canvas = await html2canvas(offscreen, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgWidth = 297;
    const pageHeight = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('teacher-performance.pdf');

    // Cleanup offscreen
    try { document.body.removeChild(offscreen); } catch (e) { /* ignore */ }
  };

  const exportToPNG = async () => {
    // Build offscreen table for full content with proper styling
    const offscreen = document.createElement('div');
    offscreen.style.position = 'absolute';
    offscreen.style.left = '-99999px';
    offscreen.style.top = '0';
    offscreen.style.background = '#ffffff';
    offscreen.style.padding = '20px';
    offscreen.style.color = '#000';
    offscreen.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    offscreen.style.fontSize = '14px';
    offscreen.style.width = '1200px';

    // Add title
    const title = document.createElement('h1');
    title.textContent = 'Teacher Performance Analysis';
    title.style.fontSize = '24px';
    title.style.fontWeight = '600';
    title.style.marginBottom = '20px';
    title.style.color = '#1f2937';
    title.style.textAlign = 'center';
    offscreen.appendChild(title);

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.background = '#ffffff';
    table.style.color = '#000';
    table.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    table.style.borderRadius = '8px';
    table.style.overflow = 'hidden';
    
    const thead = document.createElement('thead');
    thead.style.background = 'linear-gradient(to right, #334155, #1e293b, #4f46e5)';
    const headerRow = document.createElement('tr');
    ['Teacher Name','New Members','Sessions','Converted','Conversion Rate','Retained','Retention Rate'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      th.style.textAlign = 'center';
      th.style.padding = '12px 8px';
      th.style.border = '1px solid #e5e7eb';
      th.style.color = '#ffffff';
      th.style.fontWeight = '600';
      th.style.fontSize = '12px';
      th.style.textTransform = 'uppercase';
      th.style.letterSpacing = '0.05em';
      th.style.background = 'linear-gradient(to right, #334155, #1e293b, #4f46e5)';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    sortedData.forEach((r, index) => {
      const tr = document.createElement('tr');
      tr.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
      tr.style.borderBottom = '1px solid #e5e7eb';
      
      [r.trainerName, r.newMembers, r.sessions, r.converted, `${r.conversionRate.toFixed(1)}%`, r.retained, `${r.retentionRate.toFixed(1)}%`].forEach((cell, cellIndex) => {
        const td = document.createElement('td');
        td.textContent = String(cell);
        td.style.padding = '10px 8px';
        td.style.border = '1px solid #e5e7eb';
        td.style.height = '35px';
        td.style.whiteSpace = 'nowrap';
        td.style.color = '#374151';
        td.style.fontSize = '13px';
        td.style.textAlign = cellIndex === 0 ? 'left' : 'center';
        td.style.fontWeight = cellIndex === 0 ? '500' : '400';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    const trTotal = document.createElement('tr');
    trTotal.style.backgroundColor = '#f3f4f6';
    trTotal.style.borderTop = '2px solid #d1d5db';
    [totals.trainerName, totals.newMembers, totals.sessions, totals.converted, `${totals.conversionRate.toFixed(1)}%`, totals.retained, `${totals.retentionRate.toFixed(1)}%`].forEach((cell, cellIndex) => {
      const td = document.createElement('td');
      td.textContent = String(cell);
      td.style.padding = '12px 8px';
      td.style.border = '1px solid #d1d5db';
      td.style.fontWeight = '700';
      td.style.height = '40px';
      td.style.color = '#111827';
      td.style.fontSize = '14px';
      td.style.textAlign = cellIndex === 0 ? 'left' : 'center';
      td.style.backgroundColor = '#f9fafb';
      trTotal.appendChild(td);
    });
    tbody.appendChild(trTotal);
    table.appendChild(tbody);
    offscreen.appendChild(table);
    document.body.appendChild(offscreen);

    const canvas = await html2canvas(offscreen, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const link = document.createElement('a');
    link.download = 'teacher-performance.png';
    link.href = canvas.toDataURL();
    link.click();

    try { document.body.removeChild(offscreen); } catch (e) { /* ignore */ }
  };
  const totals = useMemo(() => {
    const totalNewMembers = teacherStats.reduce((sum, t) => sum + t.newMembers, 0);
    const totalSessions = teacherStats.reduce((sum, t) => sum + t.sessions, 0);
    const totalConverted = teacherStats.reduce((sum, t) => sum + t.converted, 0);
    const totalRetained = teacherStats.reduce((sum, t) => sum + t.retained, 0);
    
    const grandTotalMembers = teacherStats.reduce((sum, t) => sum + t.totalMembers, 0);
    return {
      trainerName: 'TOTAL',
      newMembers: totalNewMembers,
      totalMembers: grandTotalMembers,
      sessions: totalSessions,
      converted: totalConverted,
      conversionRate: calcConversionRate(totalConverted, totalNewMembers),
      retained: totalRetained,
      retentionRate: calcRetentionRate(totalRetained, totalNewMembers),
    };
  }, [teacherStats]);

  // Calculate growth data (placeholder since we don't have historical data)
  const growthColumns = [
    {
      key: 'trainerName',
      header: 'Teacher Name',
      render: (value: string) => (
        <div className="truncate text-black font-medium p57-cell-line">
          {value}
        </div>
      ),
      align: 'left' as const,
      sortable: true
    },
    {
      key: 'newMembers',
      header: 'New Members Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'sessions',
      header: 'Sessions Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'converted',
      header: 'Conversions Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'conversionRate',
      header: 'Conv. Rate Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'retained',
      header: 'Retention Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'retentionRate',
      header: 'Ret. Rate Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
  ];

  const columns = displayMode === 'values' ? [
    {
      key: 'trainerName',
      header: 'Teacher Name',
      render: (value: string) => (
        <div className="truncate text-black font-medium p57-cell-line">
          {value}
        </div>
      ),
      align: 'left' as const,
      sortable: true
    },
    {
      key: 'newMembers',
      header: 'New Members',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'sessions',
      header: 'Sessions',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'converted',
      header: 'Converted',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'conversionRate',
      header: 'Conversion Rate',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          {formatPercentage(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'retained',
      header: 'Retained',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'retentionRate',
      header: 'Retention Rate',
      render: (value: number) => (
        <div className="text-center text-black font-medium p57-cell-line">
          {formatPercentage(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
  ] : growthColumns;

  return (
    <div ref={containerRef} className="space-y-6">
      <P57TableShell
        icon={UserCheck}
        title="Teacher Performance"
        description="Comprehensive teacher metrics including conversions and retention rates. Click a row for drill-down evidence."
        rowCount={sortedData.length}
        rowCountLabel="teachers"
        onSearch={setQuery}
        searchPlaceholder="Search teachers\u2026"
        onExportCsv={exportToCSV}
        meta={<span>{formatNumber(totals.newMembers)} new members \u00b7 {totals.conversionRate.toFixed(1)}% conversion</span>}
        actions={
          <>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-semibold">
              {(['values', 'growth'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setDisplayMode(m)}
                  className={displayMode === m ? 'rounded-full bg-white px-2.5 py-1 text-slate-900 shadow-sm' : 'rounded-full px-2.5 py-1 text-slate-500 hover:text-slate-800'}>
                  {m === 'values' ? 'Values' : 'Growth'}
                </button>
              ))}
            </div>
            <button type="button" onClick={exportToPNG} className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
              <Image className="h-3 w-3" /> PNG
            </button>
            <button type="button" onClick={exportToPDF} className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
              <Download className="h-3 w-3" /> PDF
            </button>
            <CopyTableButton tableRef={containerRef} tableName={tableTitle} size="sm" onCopyAllTabs={async () => getAllTabsText()} />
          </>
        }
      >
            <ModernDataTable
              data={sortedData}
              columns={columns}
              showFooter={true}
              footerData={totals}
              maxHeight="560px"
              stickyHeader={true}
              onRowClick={onRowClick ? (row) => onRowClick(row) : undefined}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
              tableId={tableTitle}
            />
      </P57TableShell>
    </div>
  );
};