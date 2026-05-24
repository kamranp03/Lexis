import axios from 'axios';

const api = axios.create({
  baseURL: 'https://smartquery-backend.onrender.com/api',
});

// --- Types ---
export interface ConnectionConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  uri?: string;
}

export interface Connection {
  id: number;
  name: string;
  db_type: 'postgresql' | 'mysql' | 'mongodb' | 'oracle';
  config: ConnectionConfig;
  created_at: string;
  last_used?: string;
}

export interface ConnectionCreate {
  name: string;
  db_type: string;
  config: ConnectionConfig;
}

export interface QueryResult {
  columns?: string[];
  rows?: Record<string, unknown>[];
  documents?: Record<string, unknown>[];
  row_count: number;
  execution_ms: number;
  db_type: string;
  error?: string;
}

export interface HistoryEntry {
  id: number;
  connection_id: number;
  query_text: string;
  query_type: string;
  nl_prompt?: string;
  status: string;
  error_message?: string;
  execution_ms?: number;
  row_count?: number;
  is_favorite: boolean;
  created_at: string;
}

export interface TableInfo {
  name: string;
  type: string;
}

export interface TableDetail {
  name: string;
  columns: { name: string; type: string; nullable: boolean; default?: string }[];
  indexes: { name: string; definition?: string; keys?: Record<string, number> }[];
  foreign_keys: { column: string; references_table: string; references_column: string }[];
}

export interface Drivers {
  postgresql: boolean;
  mysql: boolean;
  mongodb: boolean;
  oracle: boolean;
}

// --- API functions ---
export const getDrivers = () => api.get<Drivers>('/connections/drivers').then(r => r.data);
export const getConnections = () => api.get<Connection[]>('/connections').then(r => r.data);
export const createConnection = (data: ConnectionCreate) => api.post<Connection>('/connections', data).then(r => r.data);
export const updateConnection = (id: number, data: Partial<ConnectionCreate>) => api.put<Connection>(`/connections/${id}`, data).then(r => r.data);
export const deleteConnection = (id: number) => api.delete(`/connections/${id}`);
export const testConnection = (id: number) => api.post<{ success: boolean; message: string }>(`/connections/${id}/test`).then(r => r.data);

export const executeQuery = (connection_id: number, query: string) =>
  api.post<QueryResult>('/query/execute', { connection_id, query }).then(r => r.data);

export const getTables = (connId: number) => api.get<TableInfo[]>(`/schema/${connId}/tables`).then(r => r.data);
export const getTableDetail = (connId: number, name: string) => api.get<TableDetail>(`/schema/${connId}/tables/${name}`).then(r => r.data);

export const getHistory = (params?: { connection_id?: number; favorites_only?: boolean; limit?: number; offset?: number }) =>
  api.get<HistoryEntry[]>('/history', { params }).then(r => r.data);
export const toggleFavorite = (id: number) => api.post<HistoryEntry>(`/history/${id}/favorite`).then(r => r.data);
export const deleteHistoryEntry = (id: number) => api.delete(`/history/${id}`);

// --- AI ---
export interface AIResponse {
  intent?: string;
  generated_query?: string;
  fixed_query?: string;
  explanation?: string;
  optimization?: string;
  executed_result?: QueryResult;
  error?: string;
}

export const aiNlToQuery = (connection_id: number, prompt: string, generate_only = false) =>
  api.post<AIResponse>('/ai/nl-to-query', { connection_id, prompt, generate_only }).then(r => r.data);

export const aiExplainResults = (connection_id: number, query: string, results: Record<string, unknown>[]) =>
  api.post<AIResponse>('/ai/explain-results', { connection_id, query, results }).then(r => r.data);

export const aiOptimize = (connection_id: number, query: string) =>
  api.post<AIResponse>('/ai/optimize', { connection_id, query }).then(r => r.data);

export const aiFixError = (connection_id: number, query: string, error: string) =>
  api.post<AIResponse>('/ai/fix-error', { connection_id, query, error }).then(r => r.data);
