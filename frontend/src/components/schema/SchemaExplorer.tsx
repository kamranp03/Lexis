import { useState } from 'react';
import { ChevronRight, ChevronDown, KeyRound } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { getTableDetail, type TableDetail } from '../../api/client';

const TYPE_COLOR: Record<string, string> = {
  INT: '#3b82f6', INTEGER: '#3b82f6', BIGINT: '#3b82f6', SMALLINT: '#3b82f6',
  SERIAL: '#3b82f6', BIGSERIAL: '#3b82f6',
  TEXT: '#14b8a6', VARCHAR: '#14b8a6', CHAR: '#14b8a6',
  BOOLEAN: '#a855f7', BOOL: '#a855f7',
  TIMESTAMP: '#f97316', DATE: '#f97316', TIME: '#f97316', TIMESTAMPTZ: '#f97316',
  DECIMAL: '#3b82f6', NUMERIC: '#3b82f6', FLOAT: '#3b82f6', DOUBLE: '#3b82f6', REAL: '#3b82f6',
  JSON: '#eab308', JSONB: '#eab308',
  UUID: '#ec4899',
};

function typeColor(type: string) {
  const base = type.split('(')[0].toUpperCase().trim();
  return TYPE_COLOR[base] || '#888888';
}

function shortType(type: string) {
  const map: Record<string, string> = {
    'CHARACTER VARYING': 'VARCHAR', 'TIMESTAMP WITHOUT TIME ZONE': 'TIMESTAMP',
    'TIMESTAMP WITH TIME ZONE': 'TIMESTAMPTZ', 'DOUBLE PRECISION': 'DOUBLE',
  };
  const upper = type.toUpperCase().split('(')[0].trim();
  return map[upper] || upper;
}

export function SchemaExplorer() {
  const { tables, activeConnection } = useAppStore();

  if (!activeConnection) {
    return (
      <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        Select a connection first
      </p>
    );
  }

  if (tables.length === 0) {
    return (
      <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        No tables found
      </p>
    );
  }

  return (
    <div className="py-1">
      {tables.map(t => (
        <TableItem key={t.name} name={t.name} connId={activeConnection.id} dbType={activeConnection.db_type} />
      ))}
    </div>
  );
}

function TableItem({ name, connId, dbType }: { name: string; connId: number; dbType: string }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<TableDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { setQueryText } = useAppStore();

  const toggle = async () => {
    if (!expanded && !detail) {
      setLoading(true);
      try {
        const d = await getTableDetail(connId, name);
        setDetail(d);
      } catch { /* ignore */ }
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  const handleDoubleClick = () => {
    if (dbType === 'mongodb') {
      setQueryText(JSON.stringify({ collection: name, method: 'find', filter: {}, limit: 20 }, null, 2));
    } else {
      setQueryText(`SELECT * FROM ${name} LIMIT 100;`);
    }
  };

  const handleClickColumn = (colName: string) => {
    if (dbType !== 'mongodb') {
      setQueryText(`SELECT ${colName} FROM ${name} LIMIT 100;`);
    }
  };

  const colCount = detail?.columns.length ?? 0;

  return (
    <div>
      <button
        onClick={toggle}
        onDoubleClick={handleDoubleClick}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs transition-colors"
        style={{ color: 'var(--text-primary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ color: 'var(--text-tertiary)', width: 12, flexShrink: 0, display: 'flex' }}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        <span className="flex-1 text-left font-medium truncate">{name}</span>
        {detail && (
          <span className="text-[11px] shrink-0" style={{ color: 'var(--text-tertiary)' }}>
            {colCount} cols
          </span>
        )}
      </button>

      {expanded && loading && (
        <p className="pl-10 py-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
      )}

      {expanded && detail && (
        <div>
          {detail.columns.map(col => {
            const colTypeLabel = shortType(col.type);
            const isPK = detail.indexes.some(
              idx => idx.name?.toLowerCase().includes('pkey') && (idx.definition || '').includes(col.name)
            );
            return (
              <button
                key={col.name}
                onClick={() => handleClickColumn(col.name)}
                className="w-full flex items-center gap-2 pl-10 pr-4 py-1 text-[12px] transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {isPK
                  ? <KeyRound size={10} style={{ color: '#f97316', flexShrink: 0 }} />
                  : <span style={{ width: 10, flexShrink: 0 }} />
                }
                <span className="flex-1 text-left truncate">{col.name}</span>
                <span className="text-[11px] font-semibold shrink-0" style={{ color: typeColor(col.type) }}>
                  {colTypeLabel}
                </span>
              </button>
            );
          })}

          {detail.indexes.filter(idx => !idx.name?.toLowerCase().includes('pkey')).map(idx => (
            <div
              key={idx.name}
              className="flex items-center gap-2 pl-10 pr-4 py-0.5 text-[11px] italic"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <span className="flex-1 truncate">{idx.name}</span>
              {(idx.definition || '').toLowerCase().includes('unique') && (
                <span
                  className="text-[10px] font-semibold not-italic px-1.5 py-0 rounded"
                  style={{ color: '#f97316', background: 'rgba(249,115,22,0.12)' }}
                >
                  UNIQUE
                </span>
              )}
            </div>
          ))}

          {detail.foreign_keys.map((fk, i) => (
            <div
              key={i}
              className="flex items-center pl-10 pr-4 py-0.5 text-[11px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <span className="truncate">
                {fk.column} <span style={{ margin: '0 2px' }}>→</span> {fk.references_table}.{fk.references_column}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
