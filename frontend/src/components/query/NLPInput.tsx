import { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { aiNlToQuery, executeQuery } from '../../api/client';

const STATUS_COLOR: Record<string, string> = {
  'Generating SQL...': '#3b82f6',
  'Executing...':      '#f97316',
  'Done':              '#22c55e',
};

export function NLPInput() {
  const { activeConnection, setQueryText, setQueryResult, setIsExecuting } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConnection || !prompt.trim()) return;

    setLoading(true);
    setAiMessage('Generating SQL...');
    setQueryResult(null);
    setQueryText('');
    setIsExecuting(false);

    try {
      const genRes = await aiNlToQuery(activeConnection.id, prompt, true);

      if (genRes.error) {
        setAiMessage(genRes.error);
        setLoading(false);
        return;
      }

      const generatedQuery = genRes.generated_query;
      if (!generatedQuery) {
        setAiMessage('No query generated.');
        setLoading(false);
        return;
      }

      setQueryText(generatedQuery);
      setAiMessage('Executing...');
      setIsExecuting(true);

      try {
        const execResult = await executeQuery(activeConnection.id, generatedQuery);
        setQueryResult(execResult);
        setAiMessage(execResult.error ? `Error: ${execResult.error}` : 'Done');
      } catch (execErr: unknown) {
        const msg = execErr instanceof Error ? execErr.message : 'Execution failed';
        setAiMessage(msg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI request failed';
      setAiMessage(msg);
    }

    setIsExecuting(false);
    setLoading(false);
  };

  const canSubmit = !!activeConnection && !!prompt.trim() && !loading;

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', padding: '10px 16px' }}>
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all"
          style={{
            border: '1.5px solid var(--border)',
            background: 'var(--bg-secondary)',
          }}
          onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
          onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
        >
          {/* Animated sparkle */}
          <div
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
          >
            {loading
              ? <Loader2 size={13} className="animate-spin" style={{ color: '#fff' }} />
              : <Sparkles size={13} style={{ color: '#fff' }} />
            }
          </div>

          {/* Input */}
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={activeConnection ? "Ask in natural language... e.g. 'Show all users from last month'" : 'Select a connection first'}
            disabled={!activeConnection || loading}
            className="flex-1 text-sm bg-transparent outline-none disabled:opacity-50"
            style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />

          {/* Status badge */}
          {aiMessage && (
            <span
              className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                color: STATUS_COLOR[aiMessage] || 'var(--text-tertiary)',
                background: aiMessage === 'Done'
                  ? 'rgba(34,197,94,0.1)'
                  : aiMessage === 'Executing...'
                  ? 'rgba(249,115,22,0.1)'
                  : aiMessage === 'Generating SQL...'
                  ? 'rgba(59,130,246,0.1)'
                  : 'rgba(0,0,0,0.05)',
              }}
            >
              {aiMessage}
            </span>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                : 'var(--bg-hover)',
              color: canSubmit ? '#fff' : 'var(--text-tertiary)',
              boxShadow: canSubmit ? '0 2px 8px rgba(59,130,246,0.35)' : 'none',
            }}
            onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(59,130,246,0.5)'; }}
            onMouseLeave={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(59,130,246,0.35)'; }}
          >
            <ArrowRight size={13} />
            Execute
          </button>
        </div>
      </form>
    </div>
  );
}
