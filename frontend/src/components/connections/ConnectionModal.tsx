import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { createConnection, getConnections, getDrivers, type Drivers } from '../../api/client';

type Tab = 'form' | 'uri';

export function ConnectionModal() {
  const { showConnectionModal, setShowConnectionModal, setConnections } = useAppStore();
  const [tab, setTab] = useState<Tab>('form');
  const [drivers, setDrivers] = useState<Drivers | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [dbType, setDbType] = useState('postgresql');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [uri, setUri] = useState('');

  useEffect(() => {
    if (showConnectionModal) {
      getDrivers().then(setDrivers).catch(console.error);
    }
  }, [showConnectionModal]);

  useEffect(() => {
    const defaults: Record<string, string> = { postgresql: '5432', mongodb: '27017', oracle: '1521' };
    setPort(defaults[dbType] || '5432');
  }, [dbType]);

  if (!showConnectionModal) return null;

  const resetForm = () => {
    setName(''); setDbType('postgresql'); setHost('localhost'); setPort('5432');
    setUsername(''); setPassword(''); setDatabase(''); setUri('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = tab === 'uri'
        ? { uri }
        : { host, port: parseInt(port), username, password, database };
      await createConnection({ name, db_type: dbType, config });
      const updated = await getConnections();
      setConnections(updated);
      resetForm();
      setShowConnectionModal(false);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--bg-primary)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]';
  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-[var(--bg-primary)] rounded-lg shadow-xl w-full max-w-md border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold">New Connection</h2>
          <button onClick={() => setShowConnectionModal(false)} className="p-1 rounded hover:bg-[var(--bg-hover)]">
            <X size={16} />
          </button>
        </div>

        {/* Driver availability */}
        {drivers && (
          <div className="px-5 pt-3 flex gap-2">
            {Object.entries(drivers).map(([key, available]) => (
              <span
                key={key}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  available
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-400 border border-red-200 line-through'
                }`}
              >
                {key}
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {/* Connection name */}
          <div>
            <label className={labelCls}>Connection Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My Database" className={inputCls} required />
          </div>

          {/* DB Type */}
          <div>
            <label className={labelCls}>Database Type</label>
            <select value={dbType} onChange={e => setDbType(e.target.value)} className={inputCls}>
              <option value="postgresql">PostgreSQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="oracle">Oracle</option>
            </select>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
            <button type="button" onClick={() => setTab('form')}
              className={`flex-1 py-1.5 text-xs font-medium ${tab === 'form' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
              Form
            </button>
            <button type="button" onClick={() => setTab('uri')}
              className={`flex-1 py-1.5 text-xs font-medium border-l border-[var(--border)] ${tab === 'uri' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
              Connection URI
            </button>
          </div>

          {tab === 'form' ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className={labelCls}>Host</label>
                  <input value={host} onChange={e => setHost(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Port</label>
                  <input value={port} onChange={e => setPort(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Username</label>
                  <input value={username} onChange={e => setUsername(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Database</label>
                <input value={database} onChange={e => setDatabase(e.target.value)} className={inputCls} />
              </div>
            </>
          ) : (
            <div>
              <label className={labelCls}>Connection URI</label>
              <input value={uri} onChange={e => setUri(e.target.value)} placeholder="postgresql://user:pass@localhost:5432/mydb" className={inputCls} />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Adding...' : 'Add Connection'}
          </button>
        </form>
      </div>
    </div>
  );
}
