import React, { useState } from 'react';
import { Plus, Wifi, X, Pencil } from 'lucide-react';
import { SiPostgresql, SiMysql, SiMongodb } from 'react-icons/si';
import { useAppStore } from '../../stores/appStore';
import { deleteConnection, testConnection, getConnections } from '../../api/client';

const DB_LOGO: Record<string, { bg: string; icon: React.ReactNode }> = {
  postgresql: {
    bg: '#1e3a5f',
    icon: <SiPostgresql size={16} color="#ffffff" />,
  },
  mongodb: {
    bg: '#0d3b1e',
    icon: <SiMongodb size={16} color="#00ed64" />,
  },
  mysql: {
    bg: '#1a2a3a',
    icon: <SiMysql size={18} color="#f29111" />,
  },
  oracle: {
    bg: '#3a0d0d',
    icon: (
      <svg viewBox="0 0 60 20" width="36" height="12" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="16" fontSize="16" fontWeight="bold" fill="#f80000" fontFamily="Arial, sans-serif">ORA</text>
      </svg>
    ),
  },
};

function timeAgo(ts?: string) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m || 1} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return `${Math.floor(d / 7)} wk ago`;
}

interface Props { onNew: () => void; }

export function ConnectionList({ onNew }: Props) {
  const { connections, activeConnection, setActiveConnection, setConnections, setQueryText, setQueryResult, setEditingConnection, setShowConnectionModal } = useAppStore();
  const [_testing, setTesting] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<Record<number, boolean>>({});

  const handleTest = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setTesting(id);
    try {
      const res = await testConnection(id);
      setTestResult(prev => ({ ...prev, [id]: res.success }));
    } catch {
      setTestResult(prev => ({ ...prev, [id]: false }));
    }
    setTesting(null);
    setTimeout(() => setTestResult(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteConnection(id);
    const updated = await getConnections();
    setConnections(updated);
    if (activeConnection?.id === id) setActiveConnection(null);
  };

  return (
    <div className="py-2">
      {connections.length === 0 && (
        <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
          No connections yet
        </p>
      )}

      {connections.map(conn => {
        const badge = DB_LOGO[conn.db_type] || { bg: '#333', icon: <span style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>DB</span> };
        const active = activeConnection?.id === conn.id;
        const testOk = testResult[conn.id];

        return (
          <div
            key={conn.id}
            onClick={() => { setActiveConnection(conn); setQueryText(''); setQueryResult(null); }}
            className="group relative flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
            style={{
              background: active ? 'var(--bg-active)' : 'transparent',
              borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Badge */}
            <span
              className="shrink-0 w-7 h-7 rounded flex items-center justify-center"
              style={{ background: badge.bg }}
            >
              {badge.icon}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {conn.name}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {timeAgo(conn.last_used)}
              </p>
            </div>

            {/* Right side */}
            <div className="shrink-0 flex items-center gap-1">
              {/* Test result badge — shown after testing */}
              {testResult[conn.id] !== undefined && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded group-hover:hidden"
                  style={testOk
                    ? { color: '#22c55e', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }
                    : { color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }
                  }
                >
                  {testOk ? 'OK' : 'FAIL'}
                </span>
              )}

              {/* Default status indicator when no test result */}
              {testResult[conn.id] === undefined && (
                <span
                  className="group-hover:hidden flex items-center gap-1 text-[10px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#6b7280' }}
                  />
                </span>
              )}

              {/* Action buttons — shown on hover */}
              <div className="hidden group-hover:flex items-center gap-1">
                <button
                  onClick={e => { e.stopPropagation(); setEditingConnection(conn); setShowConnectionModal(true); }}
                  title="Edit connection"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors"
                  style={{
                    color: '#3b82f6',
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)'; }}
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={e => handleTest(e, conn.id)}
                  title="Test connection"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors"
                  style={{
                    color: '#22c55e',
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.25)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.2)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.1)'; }}
                >
                  <Wifi size={11} />
                </button>
                <button
                  onClick={e => handleDelete(e, conn.id)}
                  title="Delete connection"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors"
                  style={{
                    color: '#ef4444',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* New Connection */}
      <button
        onClick={onNew}
        className="w-full flex items-center gap-2 px-4 py-2.5 mt-1 text-xs transition-colors"
        style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
      >
        <Plus size={13} />
        New Connection
      </button>
    </div>
  );
}
