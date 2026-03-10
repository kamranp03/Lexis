# DB Pro — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-10
**Author:** Akshay (with AI assistance)

---

## 1. Overview

**DB Pro** is a local, single-user database management tool with an AI-powered query assistant. It connects to PostgreSQL, MongoDB, and Oracle SQL databases, lets users write raw queries or use natural language, and displays results in context-appropriate formats — all wrapped in a clean, Notion-inspired UI.

**Tech Stack:**
- Frontend: React.js (Vite + TypeScript + TailwindCSS)
- Backend: Python (FastAPI)
- AI: LangGraph + Groq API (LLaMA models)
- App Metadata: SQLite (local persistence)
- DB Drivers: psycopg2/asyncpg (PostgreSQL), pymongo (MongoDB), oracledb (Oracle)

---

## 2. User Stories

| # | Story |
|---|-------|
| U1 | As a user, I can add a database connection via form fields or a connection URI |
| U2 | As a user, I can see which DB drivers are available on my system |
| U3 | As a user, I can write and execute raw SQL or MongoDB queries |
| U4 | As a user, I can type a natural language question and get a generated query + results |
| U5 | As a user, I can see SQL results in a sortable, paginated table |
| U6 | As a user, I can see MongoDB results as collapsible JSON document trees |
| U7 | As a user, I can browse schema — tables, collections, columns, indexes, relationships |
| U8 | As a user, I can get AI explanations of query results in plain English |
| U9 | As a user, I can get AI-suggested query optimizations |
| U10 | As a user, I get auto-fix suggestions when a query errors out |
| U11 | As a user, I can view my query history and star/favorite queries |
| U12 | As a user, I can re-run a saved/favorited query with one click |

---

## 3. Features Breakdown

### 3.1 Database Connection Management
- **Add Connection**: Form-based (host, port, username, password, database name) or connection string URI
- **Edit/Delete Connection**: Modify or remove saved connections
- **Test Connection**: Verify connectivity before saving
- **Driver Detection**: Auto-detect which DB drivers (psycopg2, pymongo, oracledb) are installed on the system
- **Connection Status**: Visual indicator (green/red dot) showing active/inactive state
- **Last Used Tracking**: Show when a connection was last used

### 3.2 Query Interface
- **Raw Query Editor**: Syntax-highlighted editor (CodeMirror) with support for SQL and MongoDB shell syntax
- **NLP Input Bar**: Separate natural language input field above the editor
- **Action Bar**: Buttons for Run, Explain Plan, Optimize (AI), and AI Fix
- **Keyboard Shortcuts**: Cmd/Ctrl+Enter to execute, Cmd/Ctrl+S to save/favorite
- **Auto-detection**: Detect query type based on active connection (SQL vs MongoDB)

### 3.3 Results Display
- **SQL Results (PostgreSQL, Oracle)**:
  - Sortable columns (click header to sort)
  - Filterable columns (search within column)
  - Pagination (default 100 rows per page)
  - Row count display
  - Execution time display
- **NoSQL Results (MongoDB)**:
  - Collapsible/expandable JSON document tree
  - Document count
  - Individual document expansion
  - Nested object/array visualization
- **Error Display**: Error message with syntax highlighting and line number reference

### 3.4 AI Assistant (Full)
- **NLP → Query**: Convert natural language to SQL/MongoDB queries using schema context
- **Result Explanation**: Summarize query results in plain English
- **Schema Exploration**: Ask questions about the database schema in natural language
- **Query Optimization**: AI suggests indexes, query rewrites, and performance improvements
- **Error Auto-Fix**: When a query fails, AI analyzes the error and suggests a corrected query
- **Safety**: Generated write/delete queries require explicit user confirmation before execution
- **Retry Loop**: If AI-generated query fails, it auto-attempts one fix before surfacing the error

### 3.5 Schema Explorer
- **Tree View**: Sidebar tree showing databases → tables/collections → columns/fields
- **Column Details**: Data types, nullable, default values, constraints
- **Index Listing**: Show indexes on each table/collection
- **Relationship View**: Foreign key relationships between tables (SQL only)

### 3.6 Query History & Favorites
- **Persistent History**: All executed queries saved with timestamp, status, execution time, row count
- **Favorite/Star**: Toggle favorite on any history entry
- **Filter**: Filter history by connection, status (success/error), favorites only
- **Re-run**: One-click re-execution of any historical query
- **NLP Tracking**: If query was AI-generated, store the original natural language prompt

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                 │
│  (Vite + TypeScript + TailwindCSS)              │
│                                                 │
│  Sidebar │ Query Editor │ Results Panel         │
│          │ NLP Input    │ Schema Explorer        │
└──────────┬──────────────────────────────────────┘
           │ REST API (HTTP on localhost)
┌──────────▼──────────────────────────────────────┐
│              FastAPI Backend                     │
│                                                 │
│  /connections   /query   /schema   /ai   /history│
│                                                 │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ DB Manager │  │ Query Exec │  │ AI Agent  │  │
│  │ (drivers)  │  │  Engine    │  │ (LangGraph│  │
│  │            │  │            │  │  + Groq)  │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘  │
│        │               │               │         │
│  ┌─────▼───────────────▼───────┐  ┌────▼──────┐ │
│  │  PostgreSQL / MongoDB /     │  │  Groq API │ │
│  │  Oracle (user databases)    │  │  (LLaMA)  │ │
│  └─────────────────────────────┘  └───────────┘ │
│                                                  │
│  ┌──────────────────────┐                        │
│  │  SQLite (app metadata│                        │
│  │  connections, history│                        │
│  │  favorites)          │                        │
│  └──────────────────────┘                        │
└──────────────────────────────────────────────────┘
```

---

## 5. API Design

### 5.1 Connections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/connections` | List saved connections |
| POST | `/api/connections` | Add connection (form or URI) |
| PUT | `/api/connections/{id}` | Update connection |
| DELETE | `/api/connections/{id}` | Delete connection |
| POST | `/api/connections/{id}/test` | Test connectivity |
| GET | `/api/drivers` | Check available DB drivers on system |

### 5.2 Query
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/query/execute` | Execute raw query against a connection |
| POST | `/api/query/explain` | Get query execution plan |

### 5.3 Schema
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schema/{conn_id}/tables` | List tables/collections |
| GET | `/api/schema/{conn_id}/tables/{name}` | Column details, indexes, constraints |
| GET | `/api/schema/{conn_id}/relationships` | Foreign key relationships |

### 5.4 AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/nl-to-query` | Natural language → generated query |
| POST | `/api/ai/explain-results` | Summarize query results in English |
| POST | `/api/ai/optimize` | Suggest query optimizations |
| POST | `/api/ai/fix-error` | Auto-fix a failed query |
| POST | `/api/ai/explore-schema` | AI-powered schema Q&A |

### 5.5 History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | Get query history (paginated, filterable) |
| POST | `/api/history/{id}/favorite` | Toggle favorite |
| DELETE | `/api/history/{id}` | Delete history entry |

---

## 6. Frontend Component Hierarchy

```
App
├── Sidebar
│   ├── ConnectionList
│   │   └── ConnectionItem (with status indicator)
│   ├── AddConnectionButton
│   ├── SchemaExplorer
│   │   ├── TableList
│   │   └── TableDetail (columns, indexes)
│   └── HistoryPanel
│       ├── HistoryItem
│       └── FavoritesFilter
├── MainContent
│   ├── ConnectionModal (form + URI tabs)
│   ├── QueryWorkspace
│   │   ├── QueryEditor (CodeMirror)
│   │   ├── NLPInput (natural language bar)
│   │   ├── ActionBar (Run, Explain, Optimize, AI Fix)
│   │   └── ResultsPanel
│   │       ├── SQLTable (sortable, filterable, paginated)
│   │       ├── DocumentView (collapsible JSON tree)
│   │       ├── AIExplanation (markdown card)
│   │       └── ErrorPanel (with AI fix suggestion)
│   └── StatusBar (connection info, execution time)
```

---

## 7. App Metadata Schema (SQLite)

```sql
CREATE TABLE connections (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    db_type     TEXT NOT NULL CHECK(db_type IN ('postgresql', 'mongodb', 'oracle')),
    config      TEXT NOT NULL,  -- JSON: {host, port, username, password, database} or {uri}
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used   TIMESTAMP
);

CREATE TABLE query_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER REFERENCES connections(id) ON DELETE CASCADE,
    query_text    TEXT NOT NULL,
    query_type    TEXT NOT NULL CHECK(query_type IN ('raw', 'nlp_generated')),
    nl_prompt     TEXT,           -- original NL input if AI-generated
    status        TEXT NOT NULL CHECK(status IN ('success', 'error')),
    error_message TEXT,
    execution_ms  INTEGER,
    row_count     INTEGER,
    is_favorite   BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. AI Agent Architecture (LangGraph)

```
                 ┌──────────────┐
                 │  User Input  │
                 │  (NL query)  │
                 └──────┬───────┘
                        ▼
                ┌───────────────┐
                │  Router Node  │ ── classifies intent:
                │               │    query | explain | optimize | fix | explore
                └───────┬───────┘
          ┌─────────┬───┴────┬──────────┐
          ▼         ▼        ▼          ▼
   ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
   │ Schema   │ │ Query  │ │Optimize│ │ Error    │
   │ Fetcher  │ │ Gen    │ │ Node   │ │ Fixer    │
   │ (tool)   │ │ Node   │ │        │ │ Node     │
   └────┬─────┘ └───┬────┘ └───┬────┘ └────┬─────┘
        │            │          │            │
        ▼            ▼          ▼            ▼
   ┌─────────────────────────────────────────────┐
   │              Response Formatter             │
   │  (returns query + explanation + confidence) │
   └─────────────────────────────────────────────┘
```

- **LLM**: Groq API with `llama-3.3-70b-versatile`
- **Schema-aware**: Agent fetches relevant schema before generating queries
- **Safety**: Write/delete queries shown to user for confirmation, never auto-executed
- **Retry**: Failed generated queries pass through Error Fixer once before surfacing

---

## 9. Non-Functional Requirements

| Concern | Approach |
|---------|----------|
| **Security** | Credentials stored locally in SQLite. No network exposure — runs on localhost only. |
| **Performance** | Query results paginated (default 100 rows). Connection pooling for active connections. |
| **Error Handling** | All DB errors surfaced with full context. AI auto-fix offered on failure. |
| **Extensibility** | DB drivers are pluggable — adding MySQL later requires only a new driver adapter. |
| **Offline** | Fully functional offline except AI features (which require Groq API). Raw queries always work. |
| **Data Privacy** | No telemetry. All data stays local. Groq API calls send only schema metadata + user query text. |

---

## 10. Constraints

1. **Driver Availability**: Features for a DB type only work if the corresponding Python driver is installed
2. **Groq API Key**: AI features require a valid Groq API key configured in `.env`
3. **Oracle Instant Client**: Oracle connectivity requires Oracle Instant Client installed on the system
4. **Local Only**: No remote access, no multi-user support, no cloud deployment
5. **Browser**: Targets modern browsers (Chrome, Firefox, Edge — latest 2 versions)

---

## 11. Implementation Phases

### Phase 1 — Foundation
- FastAPI project setup + SQLite metadata DB
- React project setup (Vite + TS + Tailwind + Notion-like theme)
- Connection management (CRUD + form/URI input + test connectivity)
- Driver availability detection
- Sidebar layout + connection list UI

### Phase 2 — Query Engine
- Raw query execution (PostgreSQL, MongoDB, Oracle)
- SQL results → sortable, paginated table component
- MongoDB results → collapsible JSON document tree
- Query history persistence + history panel UI
- Error display panel

### Phase 3 — Schema Explorer
- Schema introspection for all 3 DB types
- Sidebar schema tree (tables → columns → indexes)
- Foreign key relationship display (SQL)

### Phase 4 — AI Assistant
- LangGraph agent setup with Groq
- NLP → query generation (schema-aware)
- Result explanation in plain English
- Query optimization suggestions
- Error auto-fix with retry

### Phase 5 — Polish
- Favorites/starred queries
- Keyboard shortcuts
- Export results (CSV/JSON)
- Dark mode toggle
- Loading states and animations

---

## 12. Project Structure

```
db-pro/
├── PRD.md
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── routers/
│   │   │   ├── connections.py
│   │   │   ├── query.py
│   │   │   ├── schema.py
│   │   │   ├── ai.py
│   │   │   └── history.py
│   │   ├── services/
│   │   │   ├── db_manager.py
│   │   │   ├── query_executor.py
│   │   │   ├── schema_service.py
│   │   │   └── history_service.py
│   │   ├── ai/
│   │   │   ├── agent.py
│   │   │   ├── nodes.py
│   │   │   ├── tools.py
│   │   │   └── prompts.py
│   │   └── models/
│   │       ├── connection.py
│   │       ├── query.py
│   │       └── history.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── connections/
│   │   │   ├── query/
│   │   │   ├── results/
│   │   │   ├── schema/
│   │   │   └── history/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── styles/
│   │       └── globals.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```
