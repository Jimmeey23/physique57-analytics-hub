/**
 * Canonical CSV pipeline shared by every P57 export path.
 *
 * - `downloadCsv` / `downloadCsvArray`: single-table downloads.
 * - `buildCsvString` + `downloadTextFile`: multi-section exports
 *   (advanced dashboard export) that need the raw string first.
 * One escape implementation, one blob download — no per-component copies.
 */
export function escapeCsvCellValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsvString(
  columns: Array<{ key: string; header: string }>,
  rows: Array<Record<string, unknown>>
): string {
  const lines = [
    columns.map((c) => escapeCsvCellValue(c.header)).join(','),
    ...rows.map((row) => columns.map((c) => escapeCsvCellValue(row[c.key])).join(',')),
  ];
  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(
  filename: string,
  columns: Array<{ key: string; header: string }>,
  rows: Array<Record<string, unknown>>
): void {
  downloadTextFile(
    filename.endsWith('.csv') ? filename : `${filename}.csv`,
    buildCsvString(columns, rows)
  );
}

export function downloadCsvArray(
  filename: string,
  headers: string[],
  rows: Array<Array<unknown>>
): void {
  downloadCsv(
    filename,
    headers.map((header, i) => ({ key: `c${i}`, header })),
    rows.map((row) => Object.fromEntries(row.map((value, i) => [`c${i}`, value])))
  );
}
