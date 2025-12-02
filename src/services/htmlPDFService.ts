import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface ReportData {
  location: string;
  dateRange: string;
  sales: {
    totalRevenue: number;
    transactions: number;
    avgTransaction: number;
    uniqueCustomers: number;
  };
  clients: {
    newMembers: number;
    convertedMembers: number;
    retentionRate: number;
    avgLTV: number;
  };
  sessions: {
    totalSessions: number;
    avgClassSize: number;
    avgFillRate: number;
    totalAttendance: number;
  };
  trainers: {
    totalTrainers: number;
    totalSessions: number;
    totalPaid: number;
    avgPerSession: number;
  };
  discounts: {
    discountedSales: number;
    totalDiscount: number;
    avgDiscountPercent: number;
    revenueImpact: number;
  };
  leads: {
    totalLeads: number;
    converted: number;
    conversionRate: number;
    avgResponseTime: number;
  };
  expirations: {
    total: number;
    value: number;
    avgDaysToExpiry: number;
  };
  cancellations: {
    total: number;
    rate: number;
    pattern: string;
  };
}

export const generateHTMLPDFReport = async (data: ReportData): Promise<void> => {
  // Create PDF with A4 dimensions
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Colors
  const primaryColor = '#6366f1'; // Indigo
  const secondaryColor = '#8b5cf6'; // Purple
  const accentColor = '#ec4899'; // Pink
  const textDark = '#1e293b';
  const textLight = '#64748b';

  // Helper function to add new page if needed
  const checkAndAddPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to draw gradient background (simulated with rectangles)
  const drawGradientHeader = () => {
    pdf.setFillColor(99, 102, 241); // Primary color
    pdf.rect(0, 0, pageWidth, 50, 'F');
    pdf.setFillColor(139, 92, 246, 50); // Semi-transparent secondary
    pdf.rect(0, 25, pageWidth, 25, 'F');
  };

  // ============================================
  // PAGE 1: COVER PAGE & EXECUTIVE SUMMARY
  // ============================================
  
  drawGradientHeader();

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Analytics Report', pageWidth / 2, 25, { align: 'center' });

  // Subtitle
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.location, pageWidth / 2, 35, { align: 'center' });

  pdf.setFontSize(12);
  pdf.text(data.dateRange, pageWidth / 2, 42, { align: 'center' });

  yPosition = 60;

  // Executive Summary Section
  pdf.setTextColor(textDark);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', margin, yPosition);
  yPosition += 10;

  // Summary box with key highlights
  pdf.setFillColor(245, 247, 250);
  pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 40, 3, 3, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(textLight);
  
  const summaryText = `This comprehensive report provides insights into business performance across all key metrics including revenue, client retention, class attendance, and operational efficiency for ${data.location}.`;
  const splitText = pdf.splitTextToSize(summaryText, pageWidth - 2 * margin - 10);
  pdf.text(splitText, margin + 5, yPosition + 8);
  
  yPosition += 50;

  // Narrative executive summary
  if ((data as any).summaries?.executive) {
    checkAndAddPage(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Narrative Overview', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const execSummary = (data as any).summaries.executive as string;
    const execLines = pdf.splitTextToSize(execSummary, pageWidth - 2 * margin);
    pdf.text(execLines, margin, yPosition);
    yPosition += execLines.length * 4 + 6;
  }

  // ============================================
  // TABLE OF CONTENTS
  // ============================================

  pdf.addPage();
  yPosition = margin;

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Table of Contents', margin, yPosition);
  yPosition += 10;

  const tocSections = [
    'Executive Summary',
    'Sales Performance',
    'Client Conversion & Retention',
    'Sessions & Attendance',
    'Trainer Performance',
    'Discounts & Promotions',
    'Leads & Funnel',
    'Expirations',
    'Late Cancellations',
    'Strategic Recommendations',
  ];

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(textLight);

  tocSections.forEach((title, index) => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(`${index + 1}. ${title}`, margin, yPosition);
    yPosition += 6;
  });

  // Start main content on a new page
  pdf.addPage();
  yPosition = margin;

  // Key Metrics Grid
  const metricsData = [
    { label: 'Total Revenue', value: formatCurrency(data.sales.totalRevenue), color: [34, 197, 94] },
    { label: 'Total Transactions', value: formatNumber(data.sales.transactions), color: [59, 130, 246] },
    { label: 'New Members', value: formatNumber(data.clients.newMembers), color: [168, 85, 247] },
    { label: 'Total Sessions', value: formatNumber(data.sessions.totalSessions), color: [236, 72, 153] },
  ];

  const boxWidth = (pageWidth - 2 * margin - 15) / 2;
  const boxHeight = 28;
  const boxGap = 5;

  metricsData.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + col * (boxWidth + boxGap);
    const y = yPosition + row * (boxHeight + boxGap);

    // Box background
    pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2], 20);
    pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');

    // Border
    pdf.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'S');

    // Label
    pdf.setFontSize(9);
    pdf.setTextColor(textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text(metric.label, x + 5, y + 8);

    // Value
    pdf.setFontSize(18);
    pdf.setTextColor(textDark);
    pdf.setFont('helvetica', 'bold');
    pdf.text(metric.value, x + 5, y + 20);
  });

  yPosition += 2 * (boxHeight + boxGap) + 15;

  // ============================================
  // SALES ANALYTICS SECTION
  // ============================================
  
  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Sales Performance', margin, yPosition);
  yPosition += 8;

  // Sales metrics table
  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Revenue', formatCurrency(data.sales.totalRevenue)],
      ['Total Transactions', formatNumber(data.sales.transactions)],
      ['Average Transaction', formatCurrency(data.sales.avgTransaction)],
      ['Unique Customers', formatNumber(data.sales.uniqueCustomers)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Sales insights
  if ((data as any).summaries?.sales) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const salesSummary = (data as any).summaries.sales as string;
    const salesLines = pdf.splitTextToSize(salesSummary, pageWidth - 2 * margin);
    pdf.text(salesLines, margin, yPosition);
    yPosition += salesLines.length * 4 + 8;
  }

  // ============================================
  // CLIENT RETENTION SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Client Conversion & Retention', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['New Members', formatNumber(data.clients.newMembers)],
      ['Converted Members', formatNumber(data.clients.convertedMembers)],
      ['Retention Rate', formatPercentage(data.clients.retentionRate)],
      ['Average LTV', formatCurrency(data.clients.avgLTV)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Clients insights
  if ((data as any).summaries?.clients) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const clientSummary = (data as any).summaries.clients as string;
    const clientLines = pdf.splitTextToSize(clientSummary, pageWidth - 2 * margin);
    pdf.text(clientLines, margin, yPosition);
    yPosition += clientLines.length * 4 + 8;
  }

  // ============================================
  // SESSIONS & ATTENDANCE SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Sessions & Attendance', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Sessions', formatNumber(data.sessions.totalSessions)],
      ['Average Class Size', formatNumber(data.sessions.avgClassSize)],
      ['Average Fill Rate', formatPercentage(data.sessions.avgFillRate)],
      ['Total Attendance', formatNumber(data.sessions.totalAttendance)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Sessions insights
  if ((data as any).summaries?.sessions) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const sessionsSummary = (data as any).summaries.sessions as string;
    const sessionsLines = pdf.splitTextToSize(sessionsSummary, pageWidth - 2 * margin);
    pdf.text(sessionsLines, margin, yPosition);
    yPosition += sessionsLines.length * 4 + 8;
  }

  // ============================================
  // TRAINER PERFORMANCE SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Trainer Performance', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Trainers', formatNumber(data.trainers.totalTrainers)],
      ['Total Sessions', formatNumber(data.trainers.totalSessions)],
      ['Total Compensation', formatCurrency(data.trainers.totalPaid)],
      ['Avg Per Session', formatCurrency(data.trainers.avgPerSession)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [168, 85, 247],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Trainer insights
  if ((data as any).summaries?.trainers) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const trainerSummary = (data as any).summaries.trainers as string;
    const trainerLines = pdf.splitTextToSize(trainerSummary, pageWidth - 2 * margin);
    pdf.text(trainerLines, margin, yPosition);
    yPosition += trainerLines.length * 4 + 8;
  }

  // ============================================
  // NEW PAGE FOR ADDITIONAL METRICS
  // ============================================

  pdf.addPage();
  yPosition = margin;

  // ============================================
  // DISCOUNTS & PROMOTIONS SECTION
  // ============================================

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Discounts & Promotions', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Discounted Sales', formatNumber(data.discounts.discountedSales)],
      ['Total Discount Amount', formatCurrency(data.discounts.totalDiscount)],
      ['Average Discount %', formatPercentage(data.discounts.avgDiscountPercent)],
      ['Revenue Impact', formatCurrency(data.discounts.revenueImpact)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [236, 72, 153],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Discounts insights
  if ((data as any).summaries?.discounts) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const discountsSummary = (data as any).summaries.discounts as string;
    const discountsLines = pdf.splitTextToSize(discountsSummary, pageWidth - 2 * margin);
    pdf.text(discountsLines, margin, yPosition);
    yPosition += discountsLines.length * 4 + 8;
  }

  // ============================================
  // LEADS & FUNNEL SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Leads & Conversion Funnel', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Leads', formatNumber(data.leads.totalLeads)],
      ['Converted Leads', formatNumber(data.leads.converted)],
      ['Conversion Rate', formatPercentage(data.leads.conversionRate)],
      ['Avg Response Time', `${data.leads.avgResponseTime} hours`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Leads insights
  if ((data as any).summaries?.leads) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const leadsSummary = (data as any).summaries.leads as string;
    const leadsLines = pdf.splitTextToSize(leadsSummary, pageWidth - 2 * margin);
    pdf.text(leadsLines, margin, yPosition);
    yPosition += leadsLines.length * 4 + 8;
  }

  // ============================================
  // EXPIRATIONS SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Package Expirations', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Expirations', formatNumber(data.expirations.total)],
      ['Expiration Value', formatCurrency(data.expirations.value)],
      ['Avg Days to Expiry', `${data.expirations.avgDaysToExpiry} days`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [251, 146, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Expirations insights
  if ((data as any).summaries?.expirations) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const expSummary = (data as any).summaries.expirations as string;
    const expLines = pdf.splitTextToSize(expSummary, pageWidth - 2 * margin);
    pdf.text(expLines, margin, yPosition);
    yPosition += expLines.length * 4 + 8;
  }

  // ============================================
  // LATE CANCELLATIONS SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Late Cancellations', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Cancellations', formatNumber(data.cancellations.total)],
      ['Cancellation Rate', formatPercentage(data.cancellations.rate)],
      ['Primary Pattern', data.cancellations.pattern],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [239, 68, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Late cancellations insights
  if ((data as any).summaries?.cancellations) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const cancelSummary = (data as any).summaries.cancellations as string;
    const cancelLines = pdf.splitTextToSize(cancelSummary, pageWidth - 2 * margin);
    pdf.text(cancelLines, margin, yPosition);
    yPosition += cancelLines.length * 4 + 8;
  }

  // ============================================
  // FOOTER WITH TIMESTAMP
  // ============================================

  checkAndAddPage(30);

  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 18, 'F');

  pdf.setFontSize(8);
  pdf.setTextColor(textLight);
  pdf.setFont('helvetica', 'italic');
  const timestamp = new Date().toLocaleString();
  pdf.text(`Report generated on ${timestamp}`, margin + 5, yPosition + 7);
  pdf.text('Physique 57 Analytics Hub', margin + 5, yPosition + 13);

  // ============================================
  // FOOTERS WITH PAGE NUMBERS
  // ============================================

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    pdf.text('© 2025 Physique 57', pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // ============================================
  // SAVE PDF
  // ============================================

  const fileName = `${data.location.replace(/[^a-z0-9]/gi, '_')}_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// Generate report for multiple locations
export const generateMultiLocationHTMLPDFReports = async (
  locationsData: ReportData[],
  onProgress?: (message: string) => void
): Promise<void> => {
  for (const locationData of locationsData) {
    if (onProgress) {
      onProgress(`Generating report for ${locationData.location}...`);
    }
    await generateHTMLPDFReport(locationData);
    // Small delay between reports
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (onProgress) {
    onProgress('All reports generated successfully!');
  }
};
