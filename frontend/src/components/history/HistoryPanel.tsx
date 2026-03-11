import { useState } from 'react';
import { Star, RotateCw, Trash2, Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { toggleFavorite, deleteHistoryEntry, getHistory } from '../../api/client';

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function HistoryPanel() {
  const { history, setHistory, activeConnection, setQueryText } = useAppStore();
  const [showFavOnly, setShowFavOnly] = useState(false);

  if (!activeConnection) {
    return (
      <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        Select a connection first
      </p>
    );
  }

  const refresh = () => {
    getHistory({ connection_id: activeConnection.id, limit: 50 }).then(setHistory).catch(() => {});
  };

  const handleToggleFav = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await toggleFavorite(id);
    refresh();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteHistoryEntry(id);
    refresh();
  };

  const filtered = showFavOnly ? history.filter(e => e.is_favorite) : history;

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        {(['All', 'Favorites'] as const).map(label => {
          const isFav = label === 'Favorites';
          const active = isFav ? showFavOnly : !showFavOnly;
          return (
            <button
              key={label}
              onClick={() => setShowFavOnly(isFav)}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors"
              style={{
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
              }}
            >
              {isFav && <Star size={9} />}
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
          {showFavOnly ? 'No favorites yet' : 'No history yet'}
        </p>
      ) : (
        <div className="py-1">
          {filtered.map(entry => (
            <div
              key={entry.id}
              className="group px-4 py-2.5 cursor-pointer transition-colors"
              onClick={() => setQueryText(entry.query_text)}
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {entry.query_type === 'nlp_generated' && (
                      <Sparkles size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    )}
                    <p className="text-[12px] font-mono truncate" style={{ color: 'var(--text-primary)' }}>
                      {entry.query_text}
                    </p>
                  </div>
                  {entry.nl_prompt && (
                    <p className="text-[11px] truncate mb-1" style={{ color: 'var(--accent)' }}>
                      "{entry.nl_prompt}"
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium"
                      style={{ color: entry.status === 'success' ? 'var(--success)' : 'var(--error)' }}>
                      {entry.status}
                    </span>
                    {entry.execution_ms != null && (
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{entry.execution_ms}ms</span>
                    )}
                    {entry.row_count != null && (
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{entry.row_count} rows</span>
                    )}
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                      {timeAgo(entry.created_at)}
                    </span>
                  </div>
                </div>

                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 mt-0.5">
                  <button onClick={e => { e.stopPropagation(); setQueryText(entry.query_text); }}
                    className="p-1 rounded" style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-active)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    title="Load query">
                    <RotateCw size={11} />
                  </button>
                  <button onClick={e => handleToggleFav(e, entry.id)}
                    className="p-1 rounded"
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-active)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    title="Toggle favorite">
                    <Star size={11} style={{ color: entry.is_favorite ? '#eab308' : 'var(--text-tertiary)', fill: entry.is_favorite ? '#eab308' : 'none' }} />
                  </button>
                  <button onClick={e => handleDelete(e, entry.id)}
                    className="p-1 rounded" style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'; }}
                    title="Delete">
                    <Trash2 size={11} />
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
