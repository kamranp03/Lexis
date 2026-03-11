import { Play, Loader2, Lightbulb, Zap, Wrench, Download } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { exportCSV, exportJSON } from '../../hooks/useExport';

const DB_LABEL: Record<string, { label: string; color: string }> = {
  postgresql: { label: 'PostgreSQL', color: '#3b82f6' },
  mongodb:    { label: 'MongoDB',    color: '#22c55e' },
  mysql:      { label: 'MySQL',      color: '#f97316' },
  oracle:     { label: 'Oracle',     color: '#ef4444' },
};

interface Props {
  onExecute: () => void;
  onExplain: () => void;
  onOptimize: () => void;
  onFix: () => void;
}

export function ActionBar({ onExecute, onExplain, onOptimize, onFix }: Props) {
  const { isExecuting, activeConnection, queryResult, queryText } = useAppStore();

  const hasResult = !!queryResult && !queryResult.error;
  const hasError  = !!queryResult?.error;
  const hasQuery  = !!queryText.trim();
  const hasExportable = hasResult && (
    (queryResult?.rows?.length ?? 0) > 0 || (queryResult?.documents?.length ?? 0) > 0
  );

  const db = activeConnection
    ? (DB_LABEL[activeConnection.db_type] || { label: activeConnection.db_type, color: '#888' })
    : null;

  const ghostCls = "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const ghostStyle = { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' } as React.CSSProperties;

  return (
    <div
      className="flex items-center gap-1.5 px-4 py-2"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}
    >
      {/* Run */}
      <button
        onClick={onExecute}
        disabled={isExecuting || !activeConnection}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md disabled:opacity-50 transition-colors"
        style={{ background: 'var(--accent)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; }}
      >
        {isExecuting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
        {isExecuting ? 'Running...' : 'Run'}
      </button>

      <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />

      <button onClick={onExplain} disabled={!hasResult} className={ghostCls} style={ghostStyle}
        onMouseEnter={e => { if (hasResult) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
        <Lightbulb size={12} /> Explain
      </button>

      <button onClick={onOptimize} disabled={!hasQuery || !activeConnection} className={ghostCls} style={ghostStyle}
        onMouseEnter={e => { if (hasQuery) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
        <Zap size={12} /> Optimize
      </button>

      <button onClick={onFix} disabled={!hasError} className={ghostCls} style={ghostStyle}
        onMouseEnter={e => { if (hasError) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
        <Wrench size={12} /> AI Fix
      </button>

      {hasExportable && (
        <>
          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />
          <button onClick={() => exportCSV(queryResult!)} className={ghostCls} style={ghostStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <Download size={12} /> CSV
          </button>
          <button onClick={() => exportJSON(queryResult!)} className={ghostCls} style={ghostStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <Download size={12} /> JSON
          </button>
        </>
      )}

      {/* Right: DB label + shortcut */}
      <div className="ml-auto flex items-center gap-3">
        {db && (
          <span className="text-xs font-semibold" style={{ color: db.color }}>{db.label}</span>
        )}
        <span
          className="text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{ border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}
        >
          Ctrl+Enter to run
        </span>
      </div>
    </div>
  );
}
