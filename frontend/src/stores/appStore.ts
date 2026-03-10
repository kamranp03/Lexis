import { create } from 'zustand';
import type { Connection, QueryResult, HistoryEntry, TableInfo } from '../api/client';

type SidebarTab = 'connections' | 'schema' | 'history';

interface AppState {
  // Connections
  connections: Connection[];
  activeConnection: Connection | null;
  setConnections: (c: Connection[]) => void;
  setActiveConnection: (c: Connection | null) => void;

  // Query
  queryText: string;
  setQueryText: (q: string) => void;
  queryResult: QueryResult | null;
  setQueryResult: (r: QueryResult | null) => void;
  isExecuting: boolean;
  setIsExecuting: (v: boolean) => void;

  // Sidebar
  sidebarTab: SidebarTab;
  setSidebarTab: (t: SidebarTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  // Schema
  tables: TableInfo[];
  setTables: (t: TableInfo[]) => void;

  // History
  history: HistoryEntry[];
  setHistory: (h: HistoryEntry[]) => void;

  // Modal
  showConnectionModal: boolean;
  setShowConnectionModal: (v: boolean) => void;
  editingConnection: Connection | null;
  setEditingConnection: (c: Connection | null) => void;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  connections: [],
  activeConnection: null,
  setConnections: (connections) => set({ connections }),
  setActiveConnection: (activeConnection) => set({ activeConnection }),

  queryText: '',
  setQueryText: (queryText) => set({ queryText }),
  queryResult: null,
  setQueryResult: (queryResult) => set({ queryResult }),
  isExecuting: false,
  setIsExecuting: (isExecuting) => set({ isExecuting }),

  sidebarTab: 'connections',
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  tables: [],
  setTables: (tables) => set({ tables }),

  history: [],
  setHistory: (history) => set({ history }),

  showConnectionModal: false,
  setShowConnectionModal: (showConnectionModal) => set({ showConnectionModal }),
  editingConnection: null,
  setEditingConnection: (editingConnection) => set({ editingConnection }),

  darkMode: localStorage.getItem('dbpro-dark') === 'true',
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    localStorage.setItem('dbpro-dark', String(next));
    document.documentElement.classList.toggle('dark', next);
    return { darkMode: next };
  }),
}));
