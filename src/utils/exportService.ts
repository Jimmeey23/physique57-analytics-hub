import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ExportConfig, ExportData } from '@/components/dashboard/DataExportModal';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export class DataExportService {
  private config: ExportConfig;
  private data: ExportData[];

  constructor(config: ExportConfig, data: ExportData[]) {
    this.config = config;
    this.data = data;
  }

  async export(): Promise<void> {
    const filteredData = this.data.filter(d => this.config.selectedData.includes(d.name));
    
    switch (this.config.format) {
      case 'xlsx':
        return this.exportToExcel(filteredData);
      case 'csv':
        return this.exportToCSV(filteredData);
      case 'json':
        return this.exportToJSON(filteredData);
      case 'pdf':
        return this.exportToPDF(filteredData);
      case 'png':
      case 'svg':
        return this.exportToImage(filteredData);
      default:
        throw new Error(`Unsupported format: ${this.config.format}`);
    }
  }

  private async exportToExcel(data: ExportData[]): Promise<void> {
    const wb = XLSX.utils.book_new();

    // Add summary sheet
    const summary = this.createSummaryData(data);
    const summaryWS = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // Add data sheets
    for (const dataSource of data) {
      const processedData = this.processDataForExport(dataSource);
      const ws = XLSX.utils.json_to_sheet(processedData);
      
      // Apply styling
      this.applyExcelStyling(ws, dataSource.type);
      
      const sheetName = this.sanitizeSheetName(dataSource.name);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    // Add metadata sheet if enabled
    if (this.config.options.includeMetadata) {
      const metadataWS = this.createMetadataSheet(data);
      XLSX.utils.book_append_sheet(wb, metadataWS, 'Metadata');
    }

    // Generate file
    const buffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'array',
      password: this.config.options.password 
    });

    if (this.config.options.compression) {
      return this.compressAndDownload(buffer, `${this.config.options.customFilename}.xlsx`);
    }

    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${this.config.options.customFilename}.xlsx`);
  }

  private async exportToCSV(data: ExportData[]): Promise<void> {
    const zip = new JSZip();
    
    for (const dataSource of data) {
      const processedData = this.processDataForExport(dataSource);
      const csv = this.convertToCSV(processedData);
      const filename = `${this.sanitizeFilename(dataSource.name)}.csv`;
      zip.file(filename, csv);
    }

    // Add summary CSV
    const summary = this.createSummaryData(data);
    const summaryCSV = this.convertToCSV(summary);
    zip.file('summary.csv', summaryCSV);

    if (this.config.options.includeMetadata) {
      const metadata = this.createMetadataData(data);
      const metadataCSV = this.convertToCSV(metadata);
      zip.file('metadata.csv', metadataCSV);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${this.config.options.customFilename}.zip`);
  }

  private async exportToJSON(data: ExportData[]): Promise<void> {
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        filename: this.config.options.customFilename,
        format: this.config.format,
        config: this.config.options
      },
      summary: this.createSummaryData(data),
      data: data.map(d => ({
        name: d.name,
        type: d.type,
        metadata: this.config.options.includeMetadata ? d.metadata : undefined,
        records: this.processDataForExport(d)
      }))
    };

    let content: Blob;
    
    if (this.config.options.compression) {
      const zip = new JSZip();
      zip.file(`${this.config.options.customFilename}.json`, JSON.stringify(exportData, null, 2));
      content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${this.config.options.customFilename}.zip`);
    } else {
      content = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      saveAs(content, `${this.config.options.customFilename}.json`);
    }
  }

  private async exportToPDF(data: ExportData[]): Promise<void> {
    const pdf = new jsPDF({
      orientation: this.config.options.orientation,
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;

    // Add header
    if (this.config.options.branding) {
      pdf.setFontSize(20);
      pdf.setTextColor(30, 41, 59);
      pdf.text('PHYSIQUE 57 ANALYTICS EXPORT', 20, yPosition);
      yPosition += 15;
    }

    // Add export info
    pdf.setFontSize(12);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Filename: ${this.config.options.customFilename}`, 20, yPosition);
    yPosition += 15;

    // Add summary
    const summary = this.createSummaryData(data);
    yPosition = this.addTableToPDF(pdf, 'Export Summary', summary, yPosition);

    // Add data sections
    for (const dataSource of data) {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      const processedData = this.processDataForExport(dataSource);
      yPosition = this.addTableToPDF(pdf, dataSource.name, processedData.slice(0, 50), yPosition);
    }

    // Add watermark if specified
    if (this.config.options.watermark) {
      this.addWatermarkToPDF(pdf, this.config.options.watermark);
    }

    pdf.save(`${this.config.options.customFilename}.pdf`);
  }

  private async exportToImage(data: ExportData[]): Promise<void> {
    // Create a temporary DOM element for rendering
    const container = document.createElement('div');
    container.style.width = '1200px';
    container.style.padding = '40px';
    container.style.backgroundColor = this.config.options.theme === 'dark' ? '#1e293b' : '#ffffff';
    container.style.color = this.config.options.theme === 'dark' ? '#f1f5f9' : '#1e293b';
    container.style.fontFamily = 'Inter, system-ui, sans-serif';

    // Add content
    container.innerHTML = this.createImageHTML(data);
    
    // Temporarily add to DOM
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: this.config.options.quality / 100,
        backgroundColor: this.config.options.theme === 'dark' ? '#1e293b' : '#ffffff',
        allowTaint: true,
        useCORS: true
      });

      if (this.config.format === 'png') {
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `${this.config.options.customFilename}.png`);
          }
        }, 'image/png');
      } else {
        // Convert to SVG (simplified approach)
        const svg = this.canvasToSVG(canvas, data);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        saveAs(blob, `${this.config.options.customFilename}.svg`);
      }
    } finally {
      document.body.removeChild(container);
    }
  }

  private processDataForExport(dataSource: ExportData): any[] {
    let processedData = [...dataSource.data];

    // Apply any data transformations based on config
    if (dataSource.type === 'metrics') {
      processedData = processedData.map(item => ({
        ...item,
        formattedValue: typeof item.value === 'number' ? 
          (item.type === 'currency' ? formatCurrency(item.value) : formatNumber(item.value)) :
          item.value
      }));
    }

    return processedData;
  }

  private createSummaryData(data: ExportData[]): any[] {
    return [
      { metric: 'Export Date', value: new Date().toLocaleDateString() },
      { metric: 'Export Time', value: new Date().toLocaleTimeString() },
      { metric: 'Data Sources', value: data.length },
      { metric: 'Total Records', value: data.reduce((sum, d) => sum + d.data.length, 0) },
      { metric: 'Format', value: this.config.format.toUpperCase() },
      { metric: 'Theme', value: this.config.options.theme },
      { metric: 'Includes Metadata', value: this.config.options.includeMetadata ? 'Yes' : 'No' },
      { metric: 'Includes Charts', value: this.config.options.includeCharts ? 'Yes' : 'No' },
      { metric: 'Password Protected', value: this.config.options.password ? 'Yes' : 'No' }
    ];
  }

  private createMetadataSheet(data: ExportData[]): any {
    const metadata = this.createMetadataData(data);
    return XLSX.utils.json_to_sheet(metadata);
  }

  private createMetadataData(data: ExportData[]): any[] {
    return data.flatMap(d => [
      { source: d.name, property: 'Type', value: d.type },
      { source: d.name, property: 'Records', value: d.data.length },
      { source: d.name, property: 'Source System', value: d.metadata?.source || 'Unknown' },
      { source: d.name, property: 'Last Updated', value: d.metadata?.timestamp || 'Unknown' },
      ...(d.metadata?.filters ? Object.entries(d.metadata.filters).map(([key, value]) => ({
        source: d.name,
        property: `Filter: ${key}`,
        value: JSON.stringify(value)
      })) : [])
    ]);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private applyExcelStyling(ws: any, dataType: string): void {
    // Apply different styling based on data type
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    
    // Header styling
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[headerCell]) continue;
      
      ws[headerCell].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: dataType === 'metrics' ? '3B82F6' : '059669' } },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
    }
  }

  private addTableToPDF(pdf: any, title: string, data: any[], yPosition: number): number {
    if (data.length === 0) return yPosition;

    // Add title
    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.text(title, 20, yPosition);
    yPosition += 10;

    // Calculate column widths
    const headers = Object.keys(data[0]);
    const colWidth = (170) / headers.length; // Available width divided by columns

    // Add headers
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    headers.forEach((header, index) => {
      pdf.text(header, 20 + (index * colWidth), yPosition);
    });
    yPosition += 8;

    // Add data rows (limit to prevent overflow)
    pdf.setTextColor(51, 65, 85);
    const maxRows = Math.min(data.length, 20);
    
    for (let i = 0; i < maxRows; i++) {
      const row = data[i];
      headers.forEach((header, index) => {
        const value = String(row[header] || '').substring(0, 15); // Truncate long values
        pdf.text(value, 20 + (index * colWidth), yPosition);
      });
      yPosition += 6;
    }

    if (data.length > maxRows) {
      pdf.setFontSize(9);
      pdf.setTextColor(156, 163, 175);
      pdf.text(`... and ${data.length - maxRows} more rows`, 20, yPosition);
      yPosition += 6;
    }

    return yPosition + 10;
  }

  private addWatermarkToPDF(pdf: any, watermark: string): void {
    const pageCount = pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setGState(pdf.GState({ opacity: 0.1 }));
      pdf.setFontSize(40);
      pdf.setTextColor(156, 163, 175);
      pdf.text(watermark, 105, 150, { align: 'center', angle: 45 });
    }
  }

  private createImageHTML(data: ExportData[]): string {
    const summary = this.createSummaryData(data);
    
    return `
      <div style="max-width: 1200px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 32px; font-weight: bold; margin: 0; ${
            this.config.options.theme === 'dark' ? 'color: #f1f5f9' : 'color: #1e293b'
          }">
            Analytics Export Report
          </h1>
          <p style="font-size: 16px; margin: 10px 0; opacity: 0.7;">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
          ${summary.slice(0, 6).map(item => `
            <div style="padding: 20px; border-radius: 12px; ${
              this.config.options.theme === 'dark' 
                ? 'background: #374151; border: 1px solid #4b5563;' 
                : 'background: #f8fafc; border: 1px solid #e2e8f0;'
            }">
              <div style="font-size: 14px; opacity: 0.7; margin-bottom: 8px;">${item.metric}</div>
              <div style="font-size: 24px; font-weight: bold;">${item.value}</div>
            </div>
          `).join('')}
        </div>
        
        ${data.map(dataSource => {
          const processedData = this.processDataForExport(dataSource);
          return `
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px;">
                ${dataSource.name} (${processedData.length} records)
              </h2>
              <div style="overflow: hidden; border-radius: 12px; ${
                this.config.options.theme === 'dark' 
                  ? 'border: 1px solid #4b5563;' 
                  : 'border: 1px solid #e2e8f0;'
              }">
                ${this.createTableHTML(processedData.slice(0, 10))}
              </div>
              ${processedData.length > 10 ? `
                <p style="text-align: center; margin-top: 10px; opacity: 0.7; font-size: 14px;">
                  ... and ${processedData.length - 10} more records
                </p>
              ` : ''}
            </div>
          `;
        }).join('')}
        
        ${this.config.options.watermark ? `
          <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg); 
                      font-size: 60px; opacity: 0.1; font-weight: bold; z-index: -1; pointer-events: none;">
            ${this.config.options.watermark}
          </div>
        ` : ''}
      </div>
    `;
  }

  private createTableHTML(data: any[]): string {
    if (data.length === 0) return '<p>No data available</p>';

    const headers = Object.keys(data[0]);
    const isDark = this.config.options.theme === 'dark';
    
    return `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="${isDark ? 'background: #4b5563;' : 'background: #f1f5f9;'}">
            ${headers.map(header => `
              <th style="padding: 12px; text-align: left; font-weight: bold; 
                         border-bottom: 1px solid ${isDark ? '#6b7280' : '#e2e8f0'};">
                ${header}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map((row, index) => `
            <tr style="${index % 2 === 0 ? (isDark ? 'background: #374151;' : 'background: #ffffff;') : (isDark ? 'background: #3f3f46;' : 'background: #f8fafc;')}">
              ${headers.map(header => `
                <td style="padding: 12px; border-bottom: 1px solid ${isDark ? '#4b5563' : '#e2e8f0'};">
                  ${String(row[header] || '')}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private canvasToSVG(canvas: HTMLCanvasElement, data: ExportData[]): string {
    // Simplified SVG conversion - in a real implementation, you'd want more sophisticated conversion
    const width = canvas.width;
    const height = canvas.height;
    const dataURL = canvas.toDataURL();

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <image href="${dataURL}" width="${width}" height="${height}"/>
      </svg>
    `;
  }

  private async compressAndDownload(data: any, filename: string): Promise<void> {
    const zip = new JSZip();
    zip.file(filename, data);
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, filename.replace(/\.[^/.]+$/, '.zip'));
  }

  private sanitizeSheetName(name: string): string {
    // Excel sheet name restrictions
    return name.replace(/[:\\\/?*\[\]]/g, '_').substring(0, 31);
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
}

export const createExportData = (
  type: ExportData['type'],
  name: string,
  data: any[],
  source?: string,
  filters?: any
): ExportData => ({
  type,
  name,
  data,
  metadata: {
    source: source || 'Dashboard',
    timestamp: new Date().toISOString(),
    filters,
    aggregations: type === 'metrics' ? ['sum', 'avg', 'count'] : undefined
  }
});

export const exportDashboardData = async (
  config: ExportConfig,
  availableData: ExportData[]
): Promise<void> => {
  const service = new DataExportService(config, availableData);
  return service.export();
};