import { useAppStore } from '../../stores/appStore';

export function StatusBar() {
  const { activeConnection, queryResult, isExecuting } = useAppStore();

  return (
    <div className="h-7 flex items-center justify-between px-4 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
      <div className="flex items-center gap-3">
        {activeConnection ? (
          <>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
              {activeConnection.name}
            </span>
            <span className="text-[var(--text-tertiary)]">{activeConnection.db_type}</span>
          </>
        ) : (
          <span>No connection selected</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isExecuting && <span>Executing...</span>}
        {queryResult && !isExecuting && (
          <>
            {queryResult.error ? (
              <span className="text-[var(--error)]">Error</span>
            ) : (
              <>
                <span>{queryResult.row_count} rows</span>
                <span>{queryResult.execution_ms}ms</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
