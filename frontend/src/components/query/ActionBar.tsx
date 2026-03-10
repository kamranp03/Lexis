import { Play, Loader2, Sparkles, Zap, Wrench, Download } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { exportCSV, exportJSON } from '../../hooks/useExport';

interface Props {
  onExecute: () => void;
  onExplain: () => void;
  onOptimize: () => void;
  onFix: () => void;
}

export function ActionBar({ onExecute, onExplain, onOptimize, onFix }: Props) {
  const { isExecuting, activeConnection, queryResult, queryText } = useAppStore();

  const hasResult = !!queryResult && !queryResult.error;
  const hasError = !!queryResult?.error;
  const hasQuery = !!queryText.trim();
  const hasExportable = hasResult && ((queryResult?.rows?.length ?? 0) > 0 || (queryResult?.documents?.length ?? 0) > 0);

  const btnCls = "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors";

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <button
        onClick={onExecute}
        disabled={isExecuting || !activeConnection}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--accent)] rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
      >
        {isExecuting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
        {isExecuting ? 'Running...' : 'Run'}
      </button>

      <div className="w-px h-5 bg-[var(--border)]" />

      <button onClick={onExplain} disabled={!hasResult} className={btnCls} title="Explain results with AI">
        <Sparkles size={12} /> Explain
      </button>
      <button onClick={onOptimize} disabled={!hasQuery || !activeConnection} className={btnCls} title="Optimize query with AI">
        <Zap size={12} /> Optimize
      </button>
      <button onClick={onFix} disabled={!hasError} className={btnCls} title="Fix query error with AI">
        <Wrench size={12} /> AI Fix
      </button>

      {hasExportable && (
        <>
          <div className="w-px h-5 bg-[var(--border)]" />
          <button onClick={() => exportCSV(queryResult!)} className={btnCls} title="Export as CSV">
            <Download size={12} /> CSV
          </button>
          <button onClick={() => exportJSON(queryResult!)} className={btnCls} title="Export as JSON">
            <Download size={12} /> JSON
          </button>
        </>
      )}

      <span className="ml-auto text-xs text-[var(--text-tertiary)]">
        {activeConnection ? activeConnection.db_type : 'Select a connection'}
        <span className="ml-3">Ctrl+Enter to run</span>
      </span>
    </div>
  );
}
