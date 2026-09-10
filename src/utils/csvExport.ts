/**
 * Tiny CSV exporter shared by every P57 table shell.
 */
export function downloadCsv(
  filename: string,
  columns: Array<{ key: string; header: string }>,
  rows: Array<Record<string, unknown>>
): void {
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    columns.map((c) => escape(c.header)).join(','),
    ...rows.map((r) => columns.map((c) => escape(r[c.key])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
