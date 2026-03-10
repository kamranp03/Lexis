import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { QueryResult } from '../../api/client';

interface Props {
  result: QueryResult;
}

const PAGE_SIZE = 100;

export function SQLTable({ result }: Props) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');

  const columns = result.columns || [];
  const rows = result.rows || [];

  const filtered = useMemo(() => {
    if (!filter) return rows;
    const q = filter.toLowerCase();
    return rows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
  }, [rows, filter]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  if (columns.length === 0) {
    return (
      <div className="p-4 text-sm text-[var(--text-secondary)]">
        Query executed successfully. {result.row_count} row(s) affected.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter + info */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border)]">
        <input
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          placeholder="Filter results..."
          className="px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--bg-primary)] focus:outline-none focus:border-[var(--accent)] w-48"
        />
        <span className="text-xs text-[var(--text-tertiary)]">
          {sorted.length} row{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-[var(--bg-secondary)]">
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => toggleSort(col)}
                  className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] select-none whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {sortCol === col && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors">
                {columns.map(col => (
                  <td key={col} className="px-3 py-1.5 border-b border-[var(--border)] text-xs whitespace-nowrap max-w-xs truncate">
                    {row[col] === null ? <span className="text-[var(--text-tertiary)] italic">NULL</span> : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-t border-[var(--border)]">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 text-xs rounded border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--bg-hover)]">
            Prev
          </button>
          <span className="text-xs text-[var(--text-secondary)]">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 text-xs rounded border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--bg-hover)]">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
