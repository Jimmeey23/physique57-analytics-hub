import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { LocationReportData, LocationReportMetrics } from '@/hooks/useLocationReportData';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

interface ReportData {
  location: string;
  dateRange: string;
  sales: { totalRevenue: number; transactions: number; avgTransaction: number; uniqueCustomers: number };
  clients: { newMembers: number; convertedMembers: number; retentionRate: number; avgLTV: number };
  sessions: { totalSessions: number; avgClassSize: number; avgFillRate: number; totalAttendance: number };
  trainers: { totalTrainers: number; totalSessions: number; totalPaid: number; avgPerSession: number };
  discounts: { discountedSales: number; totalDiscount: number; avgDiscountPercent: number; revenueImpact: number };
  leads: { totalLeads: number; converted: number; conversionRate: number; avgResponseTime: number };
  expirations: { total: number; value: number; avgDaysToExpiry: number };
  cancellations: { total: number; rate: number; pattern: string };
  summaries?: {
    executive?: string; sales?: string; clients?: string; sessions?: string;
    trainers?: string; discounts?: string; leads?: string; expirations?: string;
    cancellations?: string; recommendations?: string;
  };
}

// ─── constants ────────────────────────────────────────────────────────────────
const M = 13;           // page margin (mm)
const PW = 210;         // A4 width
const PH = 297;         // A4 height
const CW = PW - M * 2; // content width

// brand palette (RGB)
const BRAND   : [number,number,number] = [99,  102, 241]; // indigo-500
const BRAND2  : [number,number,number] = [139, 92,  246]; // violet-500
const EMERALD : [number,number,number] = [16,  185, 129];
const BLUE    : [number,number,number] = [37,  99,  235];
const PURPLE  : [number,number,number] = [147, 51,  234];
const ROSE    : [number,number,number] = [225, 29,  72];
const AMBER   : [number,number,number] = [217, 119, 6];
const TEAL    : [number,number,number] = [13,  148, 136];
const SLATE   : [number,number,number] = [51,  65,  85];
const GRAY    : [number,number,number] = [100, 116, 139];
const LIGHT   : [number,number,number] = [248, 250, 252];
const WHITE   : [number,number,number] = [255, 255, 255];
const DARK    : [number,number,number] = [15,  23,  42];

// ─── helpers ──────────────────────────────────────────────────────────────────
const rgb = (pdf: jsPDF, r: number, g: number, b: number) =>
  pdf.setTextColor(r, g, b);
const fill = (pdf: jsPDF, r: number, g: number, b: number) =>
  pdf.setFillColor(r, g, b);
const draw = (pdf: jsPDF, r: number, g: number, b: number) =>
  pdf.setDrawColor(r, g, b);

const addPageFooter = (pdf: jsPDF, page: number, total: number) => {
  const y = PH - 7;
  fill(pdf, ...LIGHT); pdf.rect(0, PH - 12, PW, 12, 'F');
  draw(pdf, 203, 213, 225); pdf.setLineWidth(0.3);
  pdf.line(M, PH - 12, PW - M, PH - 12);
  rgb(pdf, ...GRAY); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
  pdf.text('Physique 57 India  •  Confidential & Proprietary', M, y);
  pdf.text(`Page ${page} of ${total}`, PW - M, y, { align: 'right' });
  pdf.text(new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }), PW / 2, y, { align: 'center' });
};

const sectionHeader = (
  pdf: jsPDF, y: number, label: string, accent: [number,number,number]
): number => {
  fill(pdf, ...accent); pdf.rect(M, y, 3, 7, 'F');
  fill(pdf, ...LIGHT); pdf.rect(M + 3, y, CW - 3, 7, 'F');
  rgb(pdf, ...DARK); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
  pdf.text(label.toUpperCase(), M + 6, y + 5);
  return y + 11;
};

const kpiCard = (
  pdf: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, accent: [number,number,number], sub?: string
) => {
  fill(pdf, ...WHITE); draw(pdf, 226, 232, 240); pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');
  fill(pdf, ...accent); pdf.rect(x, y, 2.5, h, 'F');
  rgb(pdf, ...GRAY); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
  pdf.text(label, x + 5, y + 5.5);
  rgb(pdf, ...DARK); pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
  pdf.text(value, x + 5, y + 13);
  if (sub) {
    rgb(pdf, ...GRAY); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
    pdf.text(sub, x + 5, y + 18);
  }
};

const styledTable = (
  pdf: jsPDF, y: number,
  head: string[], rows: string[][],
  accent: [number,number,number],
  colWidths?: number[]
): number => {
  const cols = head.length;
  const defaultW = CW / cols;
  const widths = colWidths || Array(cols).fill(defaultW);
  autoTable(pdf, {
    startY: y,
    head: [head],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: accent, textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 8.5, cellPadding: 3,
    },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2.8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: Object.fromEntries(widths.map((w, i) => [i, { cellWidth: w }])),
    margin: { left: M, right: M },
    tableWidth: CW,
    styles: { lineColor: [226, 232, 240], lineWidth: 0.2 },
  });
  return (pdf.lastAutoTable?.finalY ?? y + rows.length * 6 + 12) + 6;
};

const narrative = (pdf: jsPDF, y: number, text: string): number => {
  if (!text) return y;
  const lines = pdf.splitTextToSize(text, CW - 6);
  if (!lines.length) return y;
  const bh = lines.length * 3.8 + 6;
  fill(pdf, ...LIGHT); draw(pdf, 203, 213, 225); pdf.setLineWidth(0.2);
  pdf.roundedRect(M, y, CW, bh, 1.5, 1.5, 'FD');
  rgb(pdf, ...SLATE); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
  pdf.text(lines, M + 3, y + 4.5);
  return y + bh + 4;
};

const checkPage = (pdf: jsPDF, y: number, need: number): number => {
  if (y + need > PH - 18) { pdf.addPage(); return M; }
  return y;
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export const generateHTMLPDFReport = async (data: ReportData): Promise<void> => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── PAGE 1: COVER ──────────────────────────────────────────────────────────
  // Header bar
  fill(pdf, ...BRAND); pdf.rect(0, 0, PW, 38, 'F');
  fill(pdf, ...BRAND2); pdf.rect(0, 30, PW, 8, 'F');

  // Logo area
  pdf.setFillColor(255, 255, 255);
  pdf.circle(18, 19, 8, 'F');
  rgb(pdf, ...BRAND); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
  pdf.text('P57', 18, 21, { align: 'center' });

  // Report title
  rgb(pdf, ...WHITE); pdf.setFontSize(20); pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Analytics Report', 32, 16);
  pdf.setFontSize(11); pdf.setFont('helvetica', 'normal');
  pdf.text('Physique 57 India  |  Confidential', 32, 23);
  pdf.setFontSize(9);
  pdf.text(`${data.location}  ·  ${data.dateRange}`, 32, 30);

  // Generated stamp
  fill(pdf, ...BRAND2); pdf.roundedRect(PW - M - 42, 6, 42, 10, 2, 2, 'F');
  rgb(pdf, ...WHITE); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, PW - M - 21, 12, { align: 'center' });

  let y = 46;

  // ── 8-card KPI grid ─────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Total Revenue',      value: formatCurrency(data.sales.totalRevenue),         accent: EMERALD, sub: `${formatNumber(data.sales.transactions)} transactions` },
    { label: 'Avg Transaction',    value: formatCurrency(data.sales.avgTransaction),        accent: BLUE,    sub: `${formatNumber(data.sales.uniqueCustomers)} customers` },
    { label: 'New Members',        value: formatNumber(data.clients.newMembers),            accent: PURPLE,  sub: `${formatNumber(data.clients.convertedMembers)} converted` },
    { label: 'Retention Rate',     value: formatPercentage(data.clients.retentionRate),     accent: TEAL,    sub: `Avg LTV ${formatCurrency(data.clients.avgLTV)}` },
    { label: 'Total Sessions',     value: formatNumber(data.sessions.totalSessions),        accent: BLUE,    sub: `${formatNumber(data.sessions.totalAttendance)} check-ins` },
    { label: 'Avg Fill Rate',      value: formatPercentage(data.sessions.avgFillRate),      accent: AMBER,   sub: `Avg class ${data.sessions.avgClassSize.toFixed(1)} pax` },
    { label: 'Late Cancellations', value: formatNumber(data.cancellations.total),           accent: ROSE,    sub: `Rate ${formatPercentage(data.cancellations.rate)}` },
    { label: 'Total Discounts',    value: formatCurrency(data.discounts.totalDiscount),     accent: AMBER,   sub: `${formatPercentage(data.discounts.avgDiscountPercent)} avg off` },
  ];
  const cw4 = (CW - 3 * 3) / 4;
  const rh  = 22;
  for (let i = 0; i < kpis.length; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    kpiCard(pdf, M + col * (cw4 + 3), y + row * (rh + 3), cw4, rh, kpis[i].label, kpis[i].value, kpis[i].accent, kpis[i].sub);
  }
  y += 2 * (rh + 3) + 6;

  // Executive narrative
  if (data.summaries?.executive) {
    y = checkPage(pdf, y, 28);
    fill(pdf, ...LIGHT); pdf.roundedRect(M, y, CW, 22, 2, 2, 'F');
    fill(pdf, ...BRAND); pdf.rect(M, y, 2.5, 22, 'F');
    rgb(pdf, ...BRAND); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
    pdf.text('EXECUTIVE OVERVIEW', M + 6, y + 5);
    rgb(pdf, ...SLATE); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
    const execLines = pdf.splitTextToSize(data.summaries.executive, CW - 10);
    pdf.text(execLines.slice(0, 4), M + 6, y + 10);
    y += 26;
  }

  // ── PAGE 2: SALES + CLIENTS ─────────────────────────────────────────────────
  pdf.addPage();
  y = M;

  y = sectionHeader(pdf, y, 'Sales Performance', EMERALD);
  y = styledTable(pdf, y,
    ['Metric', 'Value', 'Context'],
    [
      ['Total Revenue (Net)',    formatCurrency(data.sales.totalRevenue),    'Excl. VAT'],
      ['Total Transactions',    formatNumber(data.sales.transactions),       'Unique payment events'],
      ['Average Transaction',   formatCurrency(data.sales.avgTransaction),  'Net revenue / transaction'],
      ['Unique Customers',      formatNumber(data.sales.uniqueCustomers),   'Distinct paying members'],
    ],
    EMERALD, [70, 55, 55]
  );
  if (data.summaries?.sales) y = narrative(pdf, y, data.summaries.sales);

  y = checkPage(pdf, y, 50);
  y = sectionHeader(pdf, y, 'Client Acquisition & Retention', PURPLE);
  y = styledTable(pdf, y,
    ['Metric', 'Value', 'Context'],
    [
      ['New Members',       formatNumber(data.clients.newMembers),          'First-visit clients'],
      ['Converted Members', formatNumber(data.clients.convertedMembers),    'Signed membership / pack'],
      ['Conversion Rate',   formatPercentage(data.clients.convertedMembers / Math.max(1, data.clients.newMembers) * 100), 'Converted / new'],
      ['Retention Rate',    formatPercentage(data.clients.retentionRate),   'Returned within period'],
      ['Average LTV',       formatCurrency(data.clients.avgLTV),            'Lifetime value per client'],
    ],
    PURPLE, [70, 55, 55]
  );
  if (data.summaries?.clients) y = narrative(pdf, y, data.summaries.clients);

  // ── PAGE 3: SESSIONS + TRAINERS ─────────────────────────────────────────────
  pdf.addPage();
  y = M;

  y = sectionHeader(pdf, y, 'Sessions & Attendance', BLUE);
  y = styledTable(pdf, y,
    ['Metric', 'Value', 'Context'],
    [
      ['Total Sessions',      formatNumber(data.sessions.totalSessions),         'Classes conducted'],
      ['Total Attendance',    formatNumber(data.sessions.totalAttendance),        'Total check-ins'],
      ['Average Class Size',  data.sessions.avgClassSize.toFixed(1) + ' pax',    'Check-ins per session'],
      ['Average Fill Rate',   formatPercentage(data.sessions.avgFillRate),        '% capacity filled'],
    ],
    BLUE, [70, 55, 55]
  );
  if (data.summaries?.sessions) y = narrative(pdf, y, data.summaries.sessions);

  y = checkPage(pdf, y, 50);
  y = sectionHeader(pdf, y, 'Trainer Performance & Payroll', TEAL);
  y = styledTable(pdf, y,
    ['Metric', 'Value', 'Context'],
    [
      ['Active Trainers',       formatNumber(data.trainers.totalTrainers),    'Distinct trainers'],
      ['Sessions Delivered',    formatNumber(data.trainers.totalSessions),    'Classes taken by trainers'],
      ['Total Compensation',    formatCurrency(data.trainers.totalPaid),      'Gross payroll disbursed'],
      ['Avg Pay per Session',   formatCurrency(data.trainers.avgPerSession),  'Payroll / sessions'],
    ],
    TEAL, [70, 55, 55]
  );
  if (data.summaries?.trainers) y = narrative(pdf, y, data.summaries.trainers);

  // ── PAGE 4: DISCOUNTS + LEADS ───────────────────────────────────────────────
  pdf.addPage();
  y = M;

  y = sectionHeader(pdf, y, 'Discounts & Promotions', AMBER);
  y = styledTable(pdf, y,
    ['Metric', 'Value', 'Context'],
    [
      ['Discounted Sales',      formatNumber(data.discounts.discountedSales),          'Transactions with discount'],
      ['Total Discount Amount', formatCurrency(data.discounts.totalDiscount),          'Gross discount given'],
      ['Average Discount',      formatPercentage(data.discounts.avgDiscountPercent),   '% off per transaction'],
      ['Revenue After Disc.',   formatCurrency(data.discounts.revenueImpact),          'Net revenue post-discount'],
    ],
    AMBER, [75, 55, 50]
  );
  if (data.summaries?.discounts) y = narrative(pdf, y, data.summaries.discounts);

  y = checkPage(pdf, y, 50);
  y = sectionHeader(pdf, y, 'Leads & Conversion Funnel', EMERALD);
  y = styledTable(pdf, y,
    ['Metric', 'Value', 'Context'],
    [
      ['Total Leads',           formatNumber(data.leads.totalLeads),              'Enquiries received'],
      ['Converted Leads',       formatNumber(data.leads.converted),               'Became paying members'],
      ['Conversion Rate',       formatPercentage(data.leads.conversionRate),      '% leads converted'],
      ['Avg Response Time',     `${data.leads.avgResponseTime.toFixed(1)} hrs`,   'Lead contacted within'],
    ],
    EMERALD, [70, 55, 55]
  );
  if (data.summaries?.leads) y = narrative(pdf, y, data.summaries.leads);

  // ── PAGE 5: EXPIRATIONS + CANCELLATIONS + RECOMMENDATIONS ──────────────────
  pdf.addPage();
  y = M;

  y = sectionHeader(pdf, y, 'Package Expirations', ROSE);
  y = styledTable(pdf, y,
    ['Metric', 'Value', 'Context'],
    [
      ['Total Expirations',   formatNumber(data.expirations.total),                     'Packs expiring in period'],
      ['Expiration Value',    formatCurrency(data.expirations.value),                   'Gross value at risk'],
      ['Avg Days to Expiry',  `${data.expirations.avgDaysToExpiry.toFixed(0)} days`,    'Average runway left'],
    ],
    ROSE, [75, 55, 50]
  );
  if (data.summaries?.expirations) y = narrative(pdf, y, data.summaries.expirations);

  y = checkPage(pdf, y, 50);
  y = sectionHeader(pdf, y, 'Late Cancellations', SLATE);
  y = styledTable(pdf, y,
    ['Metric', 'Value', 'Context'],
    [
      ['Total Cancellations',  formatNumber(data.cancellations.total),           'Late cancel events'],
      ['Cancellation Rate',    formatPercentage(data.cancellations.rate),        '% of total sessions'],
      ['Primary Pattern',      data.cancellations.pattern,                       'Peak risk window'],
    ],
    SLATE, [75, 55, 50]
  );
  if (data.summaries?.cancellations) y = narrative(pdf, y, data.summaries.cancellations);

  if (data.summaries?.recommendations) {
    y = checkPage(pdf, y, 40);
    y = sectionHeader(pdf, y, 'Strategic Recommendations', BRAND);
    y = narrative(pdf, y, data.summaries.recommendations);
  }

  // ── FOOTERS ─────────────────────────────────────────────────────────────────
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    addPageFooter(pdf, i, total);
  }

  const fileName = `${data.location.replace(/[^a-z0-9]/gi, '_')}_P57_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export const generateMultiLocationHTMLPDFReports = async (
  locationsData: ReportData[],
  onProgress?: (message: string) => void
): Promise<void> => {
  for (const locationData of locationsData) {
    if (onProgress) onProgress(`Generating report for ${locationData.location}…`);
    await generateHTMLPDFReport(locationData);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (onProgress) onProgress('All reports generated successfully!');
};

// ─── Location-report renderer (used by AdvancedExportButton) ─────────────────
const renderLocationReportIntoPDF = (pdf: jsPDF, reportData: LocationReportData): void => {
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = M;

  // Header
  fill(pdf, ...BRAND); pdf.rect(0, 0, PW, 28, 'F');
  rgb(pdf, ...WHITE); pdf.setFontSize(15); pdf.setFont('helvetica', 'bold');
  pdf.text('Location Performance Report', M, 13);
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  pdf.text(`${reportData.location}  ·  ${reportData.reportPeriod.monthName}`, M, 21);

  // Score pill
  fill(pdf, ...WHITE); pdf.roundedRect(PW - M - 30, 6, 30, 14, 2, 2, 'F');
  rgb(pdf, ...BRAND); pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
  pdf.text('SCORE', PW - M - 15, 12, { align: 'center' });
  pdf.setFontSize(12);
  pdf.text(`${reportData.metrics.overallScore}/100`, PW - M - 15, 19, { align: 'center' });

  y = 36;

  const checkY = (need: number) => {
    if (y + need > pageHeight - 16) { pdf.addPage(); y = M; }
  };

  const table = (head: string[], rows: string[][], accent: [number,number,number], colW?: number[]) => {
    checkY(rows.length * 6 + 14);
    autoTable(pdf, {
      startY: y, head: [head], body: rows, theme: 'grid',
      headStyles: { fillColor: accent, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8, cellPadding: 2.5 },
      bodyStyles: { fontSize: 7.5, textColor: [30,41,59], cellPadding: 2.2 },
      alternateRowStyles: { fillColor: [248,250,252] },
      columnStyles: colW ? Object.fromEntries(colW.map((w,i)=>[i,{cellWidth:w}])) : {},
      margin: { left: M, right: M }, tableWidth: CW,
      styles: { lineColor: [226,232,240], lineWidth: 0.2 },
    });
    y = (pdf.lastAutoTable?.finalY ?? y + rows.length * 6 + 14) + 5;
  };

  const sh = (label: string, accent: [number,number,number]) => {
    checkY(12);
    fill(pdf, ...accent); pdf.rect(M, y, 2.5, 7, 'F');
    fill(pdf, accent[0], accent[1], accent[2]);
    pdf.setFillColor(accent[0], accent[1], accent[2]);
    fill(pdf, ...LIGHT); pdf.rect(M + 2.5, y, CW - 2.5, 7, 'F');
    rgb(pdf, ...DARK); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.text(label, M + 7, y + 5);
    y += 11;
  };

  // Revenue
  sh('Revenue Performance', EMERALD);
  table(
    ['Metric', 'Value'],
    [
      ['Gross Revenue', formatCurrency(reportData.metrics.totalRevenue)],
      ['Net Revenue', formatCurrency(reportData.metrics.netRevenue)],
      ['VAT Amount', formatCurrency(reportData.metrics.vatAmount)],
      ['Total Transactions', formatNumber(reportData.metrics.totalTransactions)],
      ['Unique Members', formatNumber(reportData.metrics.uniqueMembers)],
      ['Avg Transaction', formatCurrency(reportData.metrics.avgTransactionValue)],
      ['Avg Spend / Member', formatCurrency(reportData.metrics.avgSpendPerMember)],
      ['Total Discounts', formatCurrency(reportData.metrics.totalDiscounts)],
      ['Discount Rate', formatPercentage(reportData.metrics.discountRate)],
    ],
    EMERALD, [90, 90]
  );

  // Sessions
  sh('Session Performance', BLUE);
  table(
    ['Metric', 'Value'],
    [
      ['Total Sessions', formatNumber(reportData.metrics.totalSessions)],
      ['Total Check-ins', formatNumber(reportData.metrics.totalCheckIns)],
      ['Avg Class Size', reportData.metrics.avgClassSize?.toFixed(1) ?? '—'],
      ['Fill Rate', formatPercentage(reportData.metrics.fillRate)],
      ['Late Cancellations', formatNumber(reportData.metrics.lateCancellations)],
    ],
    BLUE, [90, 90]
  );

  // Clients
  sh('Client Acquisition', PURPLE);
  table(
    ['Metric', 'Value'],
    [
      ['New Clients', formatNumber(reportData.metrics.newClientsAcquired)],
      ['Conversion Rate', formatPercentage(reportData.metrics.conversionRate)],
      ['Retention Rate', formatPercentage(reportData.metrics.retentionRate)],
    ],
    PURPLE, [90, 90]
  );
};

export const generateLocationPDFReport = async (reportData: LocationReportData): Promise<void> => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  renderLocationReportIntoPDF(pdf, reportData);
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    addPageFooter(pdf, i, total);
  }
  pdf.save(`${reportData.location}_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
