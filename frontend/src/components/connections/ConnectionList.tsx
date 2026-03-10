import { Database, Trash2, Plug } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { deleteConnection, testConnection, getConnections } from '../../api/client';
import { useState } from 'react';

const dbIcons: Record<string, string> = {
  postgresql: 'PG',
  mongodb: 'MG',
  oracle: 'OR',
};

export function ConnectionList() {
  const { connections, activeConnection, setActiveConnection, setConnections } = useAppStore();
  const [testing, setTesting] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<Record<number, { success: boolean; message: string }>>({});

  const handleTest = async (id: number) => {
    setTesting(id);
    try {
      const res = await testConnection(id);
      setTestResult(prev => ({ ...prev, [id]: res }));
    } catch {
      setTestResult(prev => ({ ...prev, [id]: { success: false, message: 'Failed to test' } }));
    }
    setTesting(null);
    setTimeout(() => setTestResult(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  };

  const handleDelete = async (id: number) => {
    await deleteConnection(id);
    const updated = await getConnections();
    setConnections(updated);
    if (activeConnection?.id === id) setActiveConnection(null);
  };

  return (
    <div>
      {connections.map(conn => (
        <div
          key={conn.id}
          onClick={() => setActiveConnection(conn)}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors group ${
            activeConnection?.id === conn.id
              ? 'bg-[var(--bg-hover)]'
              : 'hover:bg-[var(--bg-hover)]'
          }`}
        >
          <span className="w-6 h-6 rounded bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] shrink-0">
            {dbIcons[conn.db_type] || 'DB'}
          </span>
          <span className="flex-1 truncate">{conn.name}</span>

          {testResult[conn.id] && (
            <span className={`text-xs ${testResult[conn.id].success ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
              {testResult[conn.id].success ? 'OK' : 'Fail'}
            </span>
          )}

          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleTest(conn.id); }}
              className="p-1 rounded hover:bg-[var(--border)] text-[var(--text-tertiary)]"
              title="Test connection"
            >
              <Plug size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(conn.id); }}
              className="p-1 rounded hover:bg-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--error)]"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
      {connections.length === 0 && (
        <p className="px-3 py-4 text-xs text-[var(--text-tertiary)] text-center">
          No connections yet
        </p>
      )}
    </div>
  );
}
