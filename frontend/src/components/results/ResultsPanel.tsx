import { useAppStore } from '../../stores/appStore';
import { SQLTable } from './SQLTable';
import { DocumentView } from './DocumentView';
import { AlertCircle, Database } from 'lucide-react';

export function ResultsPanel() {
  const { queryResult, isExecuting } = useAppStore();

  if (isExecuting) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-tertiary)' }}>
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
        <span className="text-sm">Executing query...</span>
      </div>
    );
  }

  if (!queryResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-tertiary)' }}>
        <Database size={36} strokeWidth={1.2} />
        <span className="text-sm">Run a query or ask in natural language</span>
      </div>
    );
  }

  if (queryResult.error) {
    return (
      <div className="p-4">
        <div
          className="flex items-start gap-3 p-4 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertCircle size={16} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--error)' }}>Query Error</p>
            <pre className="text-xs whitespace-pre-wrap font-mono" style={{ color: 'var(--text-secondary)' }}>
              {queryResult.error}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (queryResult.db_type === 'mongodb') {
    return <DocumentView result={queryResult} />;
  }

  return <SQLTable result={queryResult} />;
}
