import { useAppStore } from '../../stores/appStore';
import { SQLTable } from './SQLTable';
import { DocumentView } from './DocumentView';
import { AlertCircle } from 'lucide-react';

export function ResultsPanel() {
  const { queryResult, isExecuting } = useAppStore();

  if (isExecuting) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Executing query...
        </div>
      </div>
    );
  }

  if (!queryResult) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[var(--text-tertiary)]">
        Run a query to see results
      </div>
    );
  }

  if (queryResult.error) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200">
          <AlertCircle size={16} className="text-[var(--error)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--error)]">Query Error</p>
            <pre className="mt-1 text-xs text-red-700 whitespace-pre-wrap font-mono">{queryResult.error}</pre>
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
