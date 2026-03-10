import type { QueryResult } from '../api/client';

export function exportCSV(result: QueryResult) {
  const rows = result.rows || [];
  const columns = result.columns || [];
  if (columns.length === 0 || rows.length === 0) return;

  const header = columns.join(',');
  const body = rows.map(row =>
    columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  ).join('\n');

  download(`${header}\n${body}`, 'query-results.csv', 'text/csv');
}

export function exportJSON(result: QueryResult) {
  const data = result.rows || result.documents || [];
  if (data.length === 0) return;
  download(JSON.stringify(data, null, 2), 'query-results.json', 'application/json');
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
