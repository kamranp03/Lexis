import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { createConnection, updateConnection, getConnections, getDrivers, type Drivers } from '../../api/client';

type Tab = 'form' | 'uri';

export function ConnectionModal() {
  const { showConnectionModal, setShowConnectionModal, setConnections, editingConnection, setEditingConnection } = useAppStore();
  const isEdit = !!editingConnection;

  const [tab, setTab] = useState<Tab>('form');
  const [drivers, setDrivers] = useState<Drivers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [dbType, setDbType] = useState('postgresql');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [uri, setUri] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editingConnection) {
      setName(editingConnection.name);
      setDbType(editingConnection.db_type);
      const cfg = editingConnection.config;
      if (cfg.uri) {
        setUri(cfg.uri);
        setTab('uri');
      } else {
        setHost(cfg.host || 'localhost');
        setPort(String(cfg.port || 5432));
        setUsername(cfg.username || '');
        setPassword(cfg.password || '');
        setDatabase(cfg.database || '');
        setTab('form');
      }
    }
  }, [editingConnection]);

  useEffect(() => {
    if (showConnectionModal) getDrivers().then(setDrivers).catch(console.error);
  }, [showConnectionModal]);

  useEffect(() => {
    if (!editingConnection) {
      const defaults: Record<string, string> = { postgresql: '5432', mysql: '3306', mongodb: '27017', oracle: '1521' };
      setPort(defaults[dbType] || '5432');
    }
  }, [dbType]);

  if (!showConnectionModal) return null;

  const resetForm = () => {
    setName(''); setDbType('postgresql'); setHost('localhost'); setPort('5432');
    setUsername(''); setPassword(''); setDatabase(''); setUri(''); setError('');
    setEditingConnection(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const config = tab === 'uri'
        ? { uri }
        : { host, port: parseInt(port), username, password, database };
      if (isEdit && editingConnection) {
        await updateConnection(editingConnection.id, { name, db_type: dbType, config });
      } else {
        await createConnection({ name, db_type: dbType, config });
      }
      const updated = await getConnections();
      setConnections(updated);
      resetForm();
      setShowConnectionModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail || (err instanceof Error ? err.message : 'Failed to save connection');
      setError(msg);
    }
    setLoading(false);
  };

  const inputBase = "w-full px-3 py-2 text-sm rounded-md outline-none transition-colors";
  const inputSt = { border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' } as React.CSSProperties;
  const lbl = { display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 } as React.CSSProperties;
  const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = 'var(--accent)'; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = 'var(--border)'; };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{isEdit ? 'Edit Connection' : 'New Connection'}</h2>
          <button onClick={() => { setShowConnectionModal(false); resetForm(); }}
            className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X size={14} />
          </button>
        </div>

        {/* Driver badges */}
        {drivers && (
          <div className="px-5 pt-4 flex flex-wrap gap-2">
            {Object.entries(drivers).map(([key, available]) => (
              <span key={key} className="text-[11px] px-2.5 py-0.5 rounded-full font-medium" style={{
                background: available ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.07)',
                color: available ? 'var(--success)' : 'var(--text-tertiary)',
                border: `1px solid ${available ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                textDecoration: available ? 'none' : 'line-through',
              }}>
                {key}
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label style={lbl}>Connection Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My Database" required
              className={inputBase} style={inputSt} onFocus={focusIn} onBlur={focusOut} />
          </div>

          <div>
            <label style={lbl}>Database Type</label>
            <select value={dbType} onChange={e => setDbType(e.target.value)}
              className={inputBase} style={inputSt} onFocus={focusIn} onBlur={focusOut}>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="oracle">Oracle</option>
            </select>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['form', 'uri'] as Tab[]).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className="flex-1 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: tab === t ? 'var(--bg-hover)' : 'transparent',
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  borderRight: t === 'form' ? '1px solid var(--border)' : 'none',
                }}>
                {t === 'form' ? 'Form' : 'Connection URI'}
              </button>
            ))}
          </div>

          {tab === 'form' ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label style={lbl}>Host</label>
                  <input value={host} onChange={e => setHost(e.target.value)} className={inputBase} style={inputSt} onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label style={lbl}>Port</label>
                  <input value={port} onChange={e => setPort(e.target.value)} className={inputBase} style={inputSt} onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={lbl}>Username</label>
                  <input value={username} onChange={e => setUsername(e.target.value)} className={inputBase} style={inputSt} onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label style={lbl}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputBase} style={inputSt} onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>
              <div>
                <label style={lbl}>Database</label>
                <input value={database} onChange={e => setDatabase(e.target.value)} className={inputBase} style={inputSt} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </>
          ) : (
            <div>
              <label style={lbl}>Connection URI</label>
              <input value={uri} onChange={e => setUri(e.target.value)}
                placeholder="postgresql://user:pass@localhost:5432/mydb"
                className={inputBase} style={inputSt} onFocus={focusIn} onBlur={focusOut} />
            </div>
          )}

          {error && (
            <p className="text-xs rounded-md px-3 py-2"
              style={{ color: 'var(--error)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading || !name}
            className="w-full py-2 text-sm font-semibold text-white rounded-md disabled:opacity-50 transition-colors"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; }}>
            {loading ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Connection')}
          </button>
        </form>
      </div>
    </div>
  );
}
