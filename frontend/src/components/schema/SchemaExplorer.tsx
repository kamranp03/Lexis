import { useState } from 'react';
import { ChevronRight, ChevronDown, Table2, Columns3, KeyRound, Link2 } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { getTableDetail, type TableDetail } from '../../api/client';

export function SchemaExplorer() {
  const { tables, activeConnection } = useAppStore();

  if (!activeConnection) {
    return <p className="px-3 py-4 text-xs text-[var(--text-tertiary)] text-center">Select a connection first</p>;
  }

  if (tables.length === 0) {
    return <p className="px-3 py-4 text-xs text-[var(--text-tertiary)] text-center">No tables found</p>;
  }

  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
        {activeConnection.db_type === 'mongodb' ? 'Collections' : 'Tables'} ({tables.length})
      </div>
      {tables.map(t => (
        <TableItem key={t.name} name={t.name} type={t.type} connId={activeConnection.id} dbType={activeConnection.db_type} />
      ))}
    </div>
  );
}

function TableItem({ name, type, connId, dbType }: { name: string; type: string; connId: number; dbType: string }) {
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

  const handleClickColumn = (colName: string) => {
    if (dbType === 'mongodb') {
      setQueryText(JSON.stringify({ collection: name, method: 'find', filter: {}, limit: 20 }, null, 2));
    } else {
      setQueryText(`SELECT ${colName} FROM ${name} LIMIT 100;`);
    }
  };

  const handleClickTable = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click = generate SELECT *
      if (dbType === 'mongodb') {
        setQueryText(JSON.stringify({ collection: name, method: 'find', filter: {}, limit: 20 }, null, 2));
      } else {
        setQueryText(`SELECT * FROM ${name} LIMIT 100;`);
      }
    }
  };

  return (
    <div>
      <button
        onClick={toggle}
        onDoubleClick={handleClickTable as never}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)] transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Table2 size={12} className="text-[var(--text-tertiary)]" />
        <span className="truncate flex-1 text-left">{name}</span>
        <span className="text-[10px] text-[var(--text-tertiary)]">{type}</span>
      </button>

      {expanded && loading && (
        <div className="ml-7 px-2 py-1 text-xs text-[var(--text-tertiary)]">Loading...</div>
      )}

      {expanded && detail && (
        <div className="ml-5 text-xs text-[var(--text-secondary)] border-l border-[var(--border)]">
          {/* Columns */}
          {detail.columns.map(col => (
            <button
              key={col.name}
              onClick={() => handleClickColumn(col.name)}
              className="w-full flex items-center gap-1.5 px-3 py-0.5 hover:bg-[var(--bg-hover)] text-left"
            >
              <Columns3 size={10} className="text-[var(--text-tertiary)] shrink-0" />
              <span className="truncate">{col.name}</span>
              <span className="text-[var(--text-tertiary)] text-[10px] ml-auto shrink-0">{col.type}</span>
              {!col.nullable && <span className="text-[var(--accent)] text-[10px] shrink-0">NN</span>}
            </button>
          ))}

          {/* Indexes */}
          {detail.indexes.length > 0 && (
            <>
              <div className="px-3 py-1 mt-1 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider border-t border-[var(--border)]">
                Indexes
              </div>
              {detail.indexes.map(idx => (
                <div key={idx.name} className="flex items-center gap-1.5 px-3 py-0.5">
                  <KeyRound size={10} className="text-yellow-600 shrink-0" />
                  <span className="truncate text-[var(--text-tertiary)]">{idx.name}</span>
                </div>
              ))}
            </>
          )}

          {/* Foreign Keys */}
          {detail.foreign_keys.length > 0 && (
            <>
              <div className="px-3 py-1 mt-1 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider border-t border-[var(--border)]">
                Relationships
              </div>
              {detail.foreign_keys.map((fk, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-0.5">
                  <Link2 size={10} className="text-purple-500 shrink-0" />
                  <span className="truncate">
                    {fk.column} <span className="text-[var(--text-tertiary)]">→</span> {fk.references_table}.{fk.references_column}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
