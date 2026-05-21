import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { ConnectionModal } from './components/connections/ConnectionModal';
import { QueryEditor } from './components/query/QueryEditor';
import { ActionBar } from './components/query/ActionBar';
import { NLPInput } from './components/query/NLPInput';
import { ResultsPanel } from './components/results/ResultsPanel';
import { AIExplanation } from './components/results/AIExplanation';
import { useAppStore } from './stores/appStore';
import { executeQuery, getHistory, aiExplainResults, aiOptimize, aiFixError } from './api/client';

function App() {
  const {
    activeConnection, queryText, queryResult, setQueryText, setQueryResult,
    setIsExecuting, setHistory,
  } = useAppStore();

  const [aiText, setAiText] = useState('');
  const [isFixing, setIsFixing] = useState(false);
  const darkMode = useAppStore(s => s.darkMode);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const refreshHistory = () => {
    if (activeConnection) {
      getHistory({ connection_id: activeConnection.id, limit: 50 })
        .then(setHistory).catch(() => {});
    }
  };

  const handleExecute = useCallback(async () => {
    if (!activeConnection || !queryText.trim()) return;
    setIsExecuting(true);
    setQueryResult(null);
    setAiText('');
    try {
      const result = await executeQuery(activeConnection.id, queryText);
      setQueryResult(result);
      refreshHistory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setQueryResult({ error: message, row_count: 0, execution_ms: 0, db_type: '' });
    }
    setIsExecuting(false);
  }, [activeConnection, queryText]);

  const handleExplain = useCallback(async () => {
    if (!activeConnection || !queryResult) return;
    const data = queryResult.rows || queryResult.documents || [];
    try {
      const res = await aiExplainResults(activeConnection.id, queryText, data);
      if (res.explanation) setAiText(res.explanation);
      else if (res.error) setAiText(`Error: ${res.error}`);
    } catch { setAiText('Failed to get explanation'); }
  }, [activeConnection, queryText, queryResult]);

  const handleOptimize = useCallback(async () => {
    if (!activeConnection || !queryText.trim()) return;
    try {
      const res = await aiOptimize(activeConnection.id, queryText);
      if (res.optimization) setAiText(res.optimization);
      else if (res.error) setAiText(`Error: ${res.error}`);
    } catch { setAiText('Failed to get optimization'); }
  }, [activeConnection, queryText]);

  const handleFix = useCallback(async () => {
    if (!activeConnection || !queryText.trim() || isFixing) return;
    setIsFixing(true);
    setAiText('AI is fixing the query...');
    try {
      const error = queryResult?.error || 'No execution error was captured. Review and correct this query using the database schema.';
      const res = await aiFixError(activeConnection.id, queryText, error);
      if (res.fixed_query) {
        const fixed = res.fixed_query.trim();
        setQueryText(fixed);
        setQueryResult(null);
        setAiText([
          'Fixed query applied to the editor. Press Run to execute it.',
          '',
          '```sql',
          fixed,
          '```',
        ].join('\n'));
      } else if (res.error) {
        setAiText(`Error: ${res.error}`);
      } else {
        setAiText('AI did not return a fixed query. Check your API key and try again.');
      }
    } catch { setAiText('Failed to fix query'); }
    finally { setIsFixing(false); }
  }, [activeConnection, queryText, queryResult, isFixing, setQueryText, setQueryResult]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <NLPInput />
        <ActionBar
          onExecute={handleExecute}
          onExplain={handleExplain}
          onOptimize={handleOptimize}
          onFix={handleFix}
          isFixing={isFixing}
        />
        <div className="flex-1 flex flex-col min-h-0">
          {/* Editor - top half */}
          <div className="h-[40%] min-h-[120px] border-b border-[var(--border)]">
            <QueryEditor onExecute={handleExecute} />
          </div>
          {/* AI explanation banner */}
          {aiText && <AIExplanation text={aiText} onClose={() => setAiText('')} />}
          {/* Results - bottom half */}
          <div className="flex-1 min-h-0">
            <ResultsPanel />
          </div>
        </div>
        <StatusBar />
      </div>
      <ConnectionModal />
    </div>
  );
}

export default App;
