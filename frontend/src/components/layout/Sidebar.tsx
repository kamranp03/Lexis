import { useEffect } from 'react';
import { Database, History, Table2, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { getConnections, getTables, getHistory } from '../../api/client';
import { ConnectionList } from '../connections/ConnectionList';
import { SchemaExplorer } from '../schema/SchemaExplorer';
import { HistoryPanel } from '../history/HistoryPanel';

const tabs = [
  { id: 'connections' as const, icon: Database, label: 'Connections' },
  { id: 'schema' as const, icon: Table2, label: 'Schema' },
  { id: 'history' as const, icon: History, label: 'History' },
];

export function Sidebar() {
  const {
    sidebarTab, setSidebarTab,
    setConnections, activeConnection, setActiveConnection, setTables, setHistory,
    setShowConnectionModal, darkMode, toggleDarkMode,
  } = useAppStore();

  useEffect(() => {
    getConnections().then((list) => {
      setConnections(list);
      const savedId = localStorage.getItem('dbpro-active-conn');
      if (savedId && !activeConnection) {
        const found = list.find((c) => c.id === Number(savedId));
        if (found) setActiveConnection(found);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeConnection) {
      getTables(activeConnection.id).then(setTables).catch(() => setTables([]));
      getHistory({ connection_id: activeConnection.id, limit: 50 }).then(setHistory).catch(() => setHistory([]));
    }
  }, [activeConnection?.id]);

  return (
    <aside
      className="w-72 h-screen flex flex-col shrink-0"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SmartQuery AI" className="w-7 h-7 rounded-md object-cover" />
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            SmartQuery AI
          </span>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Icon Tabs */}
      <div
        className="flex items-center px-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {tabs.map(tab => {
          const active = sidebarTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              title={tab.label}
              className="flex items-center justify-center py-2.5 px-3 transition-colors relative"
              style={{
                color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              <tab.icon size={16} />
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {sidebarTab === 'connections' && <ConnectionList onNew={() => setShowConnectionModal(true)} />}
        {sidebarTab === 'schema' && <SchemaExplorer />}
        {sidebarTab === 'history' && <HistoryPanel />}
      </div>
    </aside>
  );
}
