import { useState } from 'react';
import { Star, RotateCw, Trash2, Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { toggleFavorite, deleteHistoryEntry, getHistory } from '../../api/client';

export function HistoryPanel() {
  const { history, setHistory, activeConnection, setQueryText } = useAppStore();
  const [showFavOnly, setShowFavOnly] = useState(false);

  if (!activeConnection) {
    return <p className="px-3 py-4 text-xs text-[var(--text-tertiary)] text-center">Select a connection first</p>;
  }

  const refresh = () => {
    getHistory({ connection_id: activeConnection.id, limit: 50 }).then(setHistory).catch(() => {});
  };

  const handleToggleFav = async (id: number) => {
    await toggleFavorite(id);
    refresh();
  };

  const handleDelete = async (id: number) => {
    await deleteHistoryEntry(id);
    refresh();
  };

  const filtered = showFavOnly ? history.filter(e => e.is_favorite) : history;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
        <button
          onClick={() => setShowFavOnly(false)}
          className={`text-[10px] px-2 py-0.5 rounded-full border ${!showFavOnly ? 'border-[var(--accent)] text-[var(--accent)] bg-blue-50' : 'border-[var(--border)] text-[var(--text-tertiary)]'}`}
        >
          All
        </button>
        <button
          onClick={() => setShowFavOnly(true)}
          className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${showFavOnly ? 'border-yellow-400 text-yellow-600 bg-yellow-50' : 'border-[var(--border)] text-[var(--text-tertiary)]'}`}
        >
          <Star size={8} /> Favorites
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="px-3 py-4 text-xs text-[var(--text-tertiary)] text-center">
          {showFavOnly ? 'No favorites yet' : 'No history yet'}
        </p>
      ) : (
        <div className="py-1">
          {filtered.map(entry => (
            <div key={entry.id} className="group px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {entry.query_type === 'nlp_generated' && (
                      <Sparkles size={10} className="text-[var(--accent)] shrink-0" />
                    )}
                    <p className="text-xs font-mono truncate text-[var(--text-primary)]">{entry.query_text}</p>
                  </div>
                  {entry.nl_prompt && (
                    <p className="text-[10px] text-[var(--accent)] truncate mt-0.5">"{entry.nl_prompt}"</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] ${entry.status === 'success' ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                      {entry.status}
                    </span>
                    {entry.execution_ms != null && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">{entry.execution_ms}ms</span>
                    )}
                    {entry.row_count != null && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">{entry.row_count} rows</span>
                    )}
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                  <button onClick={() => setQueryText(entry.query_text)} className="p-1 rounded hover:bg-[var(--border)]" title="Load query">
                    <RotateCw size={11} className="text-[var(--text-tertiary)]" />
                  </button>
                  <button onClick={() => handleToggleFav(entry.id)} className="p-1 rounded hover:bg-[var(--border)]" title="Toggle favorite">
                    <Star size={11} className={entry.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-[var(--text-tertiary)]'} />
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="p-1 rounded hover:bg-[var(--border)]" title="Delete">
                    <Trash2 size={11} className="text-[var(--text-tertiary)]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
