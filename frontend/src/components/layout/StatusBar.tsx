import { useAppStore } from '../../stores/appStore';

const DB_COLOR: Record<string, string> = {
  postgresql: '#3b82f6', mongodb: '#22c55e', mysql: '#f97316', oracle: '#ef4444',
};
const DB_SHORT: Record<string, string> = {
  postgresql: 'PG', mongodb: 'MG', mysql: 'MY', oracle: 'ORA',
};

export function StatusBar() {
  const { activeConnection, queryResult, isExecuting } = useAppStore();
  const dbColor = activeConnection ? (DB_COLOR[activeConnection.db_type] || '#888') : '#888';
  const dbShort = activeConnection ? (DB_SHORT[activeConnection.db_type] || activeConnection.db_type.toUpperCase()) : '';

  return (
    <div
      className="h-6 flex items-center justify-between px-4 text-[11px] select-none shrink-0"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}
    >
      <div className="flex items-center gap-2">
        {activeConnection ? (
          <>
            <span style={{ color: 'var(--text-secondary)' }}>{activeConnection.name}</span>
            <span className="font-bold" style={{ color: dbColor }}>{dbShort}</span>
          </>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>No connection selected</span>
        )}
      </div>
      <div className="flex items-center gap-3" style={{ color: 'var(--text-tertiary)' }}>
        {isExecuting && <span>Executing...</span>}
        {queryResult && !isExecuting && (
          queryResult.error
            ? <span style={{ color: 'var(--error)' }}>Error</span>
            : <><span>{queryResult.row_count} rows</span><span>·</span><span>{queryResult.execution_ms}ms</span></>
        )}
      </div>
    </div>
  );
}
