import { useEffect } from 'react';
import { Database, History, Table2, Plus, PanelLeftClose, PanelLeft, Moon, Sun } from 'lucide-react';
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
    sidebarTab, setSidebarTab, sidebarOpen, setSidebarOpen,
    setConnections, activeConnection, setTables, setHistory,
    setShowConnectionModal, darkMode, toggleDarkMode,
  } = useAppStore();

  useEffect(() => {
    getConnections().then(setConnections).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeConnection) {
      getTables(activeConnection.id).then(setTables).catch(() => setTables([]));
      getHistory({ connection_id: activeConnection.id, limit: 50 }).then(setHistory).catch(() => setHistory([]));
    }
  }, [activeConnection]);

  if (!sidebarOpen) {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-10 p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
      >
        <PanelLeft size={18} />
      </button>
    );
  }

  return (
    <aside className="w-64 h-screen flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)]">
        <span className="text-sm font-semibold tracking-tight">DB Pro</span>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDarkMode}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSidebarTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
              sidebarTab === tab.id
                ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {sidebarTab === 'connections' && (
          <div>
            <button
              onClick={() => setShowConnectionModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Plus size={14} /> New connection
            </button>
            <ConnectionList />
          </div>
        )}
        {sidebarTab === 'schema' && <SchemaExplorer />}
        {sidebarTab === 'history' && <HistoryPanel />}
      </div>
    </aside>
  );
}
