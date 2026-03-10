import { useState } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { aiNlToQuery } from '../../api/client';

export function NLPInput() {
  const { activeConnection, setQueryText, setQueryResult, setIsExecuting } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConnection || !prompt.trim()) return;

    setLoading(true);
    setAiMessage('');
    setIsExecuting(true);
    try {
      const res = await aiNlToQuery(activeConnection.id, prompt);

      if (res.error) {
        setAiMessage(res.error);
        setIsExecuting(false);
        setLoading(false);
        return;
      }

      if (res.generated_query) {
        setQueryText(res.generated_query);
      }

      if (res.executed_result) {
        setQueryResult(res.executed_result);

        if (res.executed_result.error && res.fixed_query) {
          setAiMessage(`Query failed. Suggested fix applied.`);
          setQueryText(res.fixed_query);
        }
      }

      setAiMessage(res.intent === 'query' ? 'Query generated' : `AI: ${res.intent}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI request failed';
      setAiMessage(msg);
    }
    setIsExecuting(false);
    setLoading(false);
  };

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2">
        <Sparkles size={14} className="text-[var(--accent)] shrink-0" />
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={activeConnection ? "Ask in natural language... e.g. 'Show all users who signed up last month'" : "Select a connection first"}
          disabled={!activeConnection || loading}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!activeConnection || !prompt.trim() || loading}
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin text-[var(--accent)]" /> : <Send size={14} className="text-[var(--text-secondary)]" />}
        </button>
      </form>
      {aiMessage && (
        <div className="px-4 pb-2 text-xs text-[var(--text-secondary)]">
          {aiMessage}
        </div>
      )}
    </div>
  );
}
