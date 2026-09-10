/**
 * Shared export-bundle builders for the "export displayed tables" buttons.
 *
 * `ComprehensiveSalesExportButton` and `DisplayedTablesExportButton` were
 * near-identical clones; the pure content builders (CSV / text report /
 * printable HTML) plus the escaping + blob-download helpers live here so
 * every export path shares one implementation. Only the DOM table-collection
 * layer stays per-component (different tab-matcher semantics).
 */

export interface TableExportData {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
}

export interface ExportSection {
  key: string;
  heading: string;
  tabValue: string;
  tabLabel: string;
  tables: TableExportData[];
}

export interface ExportBundle {
  title: string;
  generatedAt: string;
  locationName?: string;
  locationSuffix?: string;
  dateRange?: {
    start: string;
    end: string;
    label: string;
  };
  contextLabel?: string;
  sections: ExportSection[];
}

export const escapeCsvCell = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const normalizeCellText = (value: string) => value.replace(/[↑↓▲▼]/g, '').replace(/\s+/g, ' ').trim();

export const normalizeTabValue = (value: string) => value.replace(/\s+/g, '').toLowerCase();

export const SUMMARY_ROW_LABEL_PATTERN = /^(grand\s+total|totals?|subtotals?)$/i;

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generatedStamp = (bundle: ExportBundle) => new Date(bundle.generatedAt).toLocaleString();

export const buildCsvContent = (bundle: ExportBundle, section: ExportSection, table: TableExportData) => {
  const lines: string[] = [
    `# ${bundle.title}`,
    `# Generated: ${generatedStamp(bundle)}`,
    bundle.locationName ? `# Location: ${bundle.locationName}` : undefined,
    bundle.dateRange ? `# Date Range: ${bundle.dateRange.label}` : undefined,
    bundle.contextLabel ? `# Context: ${bundle.contextLabel}` : undefined,
    `# Section: ${section.heading}`,
    `# Table: ${table.name}`,
    '',
  ].filter((line): line is string => line !== undefined);

  if (table.headers.length > 0) {
    lines.push(table.headers.map(escapeCsvCell).join(','));
  }

  table.rows.forEach((row) => {
    lines.push(row.map((cell) => escapeCsvCell(cell)).join(','));
  });

  return lines.join('\n');
};

export const buildTextReport = (bundle: ExportBundle) => {
  const lines: string[] = [
    '════════════════════════════════════════════════════════════',
    ` ${bundle.title}`,
    '════════════════════════════════════════════════════════════',
    '',
    `Generated: ${generatedStamp(bundle)}`,
    bundle.locationName ? `Location: ${bundle.locationName}` : undefined,
    bundle.dateRange ? `Date Range: ${bundle.dateRange.label}` : undefined,
    bundle.contextLabel ? `Context: ${bundle.contextLabel}` : undefined,
    `Sections: ${bundle.sections.length}`,
    '',
  ].filter((line): line is string => line !== undefined);

  bundle.sections.forEach((section, sectionIndex) => {
    lines.push(`## ${sectionIndex + 1}. ${section.heading}`);
    lines.push('');
    section.tables.forEach((table, tableIndex) => {
      lines.push(`### ${sectionIndex + 1}.${tableIndex + 1} ${table.name}`);
      lines.push(`Columns: ${table.headers.length} | Rows: ${table.rows.length}`);
      lines.push('');
      if (table.headers.length > 0) {
        lines.push(table.headers.join(' | '));
        lines.push(table.headers.map(() => '---').join(' | '));
      }
      table.rows.forEach((row) => lines.push(row.join(' | ')));
      lines.push('');
    });
  });

  return lines.join('\n');
};

export const buildPrintableHtml = (bundle: ExportBundle) => {
  const styles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 24px; margin-bottom: 12px; }
      h2 { font-size: 18px; margin: 28px 0 10px; color: #1e293b; }
      h3 { font-size: 14px; margin: 16px 0 8px; color: #475569; }
      .meta { font-size: 12px; color: #64748b; margin-bottom: 4px; }
      table { border-collapse: collapse; width: 100%; margin: 10px 0 20px; font-size: 12px; }
      th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
      thead th { background: #0f172a; color: white; }
      .page-break { page-break-after: always; }
    </style>
  `;

  let html = `<!doctype html><html><head><meta charset="utf-8" />${styles}<title>${escapeHtml(bundle.title)}</title></head><body>`;
  html += `<h1>${escapeHtml(bundle.title)}</h1>`;
  html += `<div class="meta">Generated: ${escapeHtml(generatedStamp(bundle))}</div>`;
  if (bundle.locationName) {
    html += `<div class="meta">Location: ${escapeHtml(bundle.locationName)}</div>`;
  }
  if (bundle.dateRange) {
    html += `<div class="meta">Date Range: ${escapeHtml(bundle.dateRange.label)}</div>`;
  }
  if (bundle.contextLabel) {
    html += `<div class="meta">Context: ${escapeHtml(bundle.contextLabel)}</div>`;
  }

  bundle.sections.forEach((section, sectionIndex) => {
    html += `<h2>${escapeHtml(section.heading)}</h2>`;
    section.tables.forEach((table) => {
      html += `<h3>${escapeHtml(table.name)}</h3>`;
      html += '<table><thead><tr>';
      table.headers.forEach((header) => {
        html += `<th>${escapeHtml(header)}</th>`;
      });
      html += '</tr></thead><tbody>';
      table.rows.forEach((row) => {
        html += '<tr>';
        row.forEach((cell) => {
          html += `<td>${escapeHtml(cell)}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
    });
    if (sectionIndex < bundle.sections.length - 1) {
      html += '<div class="page-break"></div>';
    }
  });

  html += '</body></html>';
  return html;
};
