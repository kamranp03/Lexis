<div align="center">

# ⚡ Lexis

### _Talk to your databases. Let AI do the heavy lifting._

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-AI_Agent-FF6B6B?style=for-the-badge&logo=openai&logoColor=white)](https://langchain-ai.github.io/langgraph)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=for-the-badge)](https://groq.com)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)

</div>

---

## 🧠 What is Lexis?

**Lexis** (internally codenamed *DB Pro*) is a local, single-user **AI-powered database management tool** that lets you interact with your databases using plain English — no SQL expertise required.

Connect to **PostgreSQL**, **MongoDB**, or **Oracle**, write raw queries or just describe what you want, and let the AI generate, explain, optimize, and fix queries for you — all wrapped in a clean, Notion-inspired UI.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔌 **Multi-DB Support** | Connect to PostgreSQL, MongoDB, and Oracle SQL |
| 💬 **Natural Language Queries** | Describe what you want in plain English → get a SQL/Mongo query |
| 🛠️ **AI Error Fixer** | Query fails? AI analyzes and suggests a corrected query automatically |
| 📊 **Smart Results** | SQL → sortable paginated table · MongoDB → collapsible JSON tree |
| 🗂️ **Schema Explorer** | Browse tables, columns, indexes, and foreign key relationships |
| 📝 **Query History** | All queries saved with execution time, status, and favorite toggle |
| ⚡ **Query Optimizer** | AI suggests indexes and rewrites for better performance |
| 🔍 **Result Explainer** | AI summarizes query results in plain English |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         React Frontend              │
│  Vite · TypeScript · TailwindCSS    │
│  CodeMirror · Zustand · Axios       │
│  → http://localhost:5173            │
└──────────────┬──────────────────────┘
               │ REST API
┌──────────────▼──────────────────────┐
│         FastAPI Backend             │
│  → http://localhost:8000            │
│                                     │
│  /connections /query /schema        │
│  /ai          /history              │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ DB Mgr   │  │  AI Agent        │ │
│  │ psycopg2 │  │  LangGraph       │ │
│  │ pymongo  │  │  + Groq LLaMA    │ │
│  │ oracledb │  │  3.3-70b         │ │
│  └──────────┘  └──────────────────┘ │
│                                     │
│  SQLite (connections · history)     │
└─────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Python 3.12+**
- **Node.js 18+** and **npm**
- **Git**
- A **Groq API Key** → get one free at [console.groq.com](https://console.groq.com)
- At least one of: PostgreSQL, MongoDB, or Oracle running locally or remotely

---

### 📦 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd SmartQuery_AI
```

---

### 🔧 2 — Backend Setup

#### a) Create & activate a virtual environment

```bash
cd backend

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv-win
venv-win\Scripts\activate
```

#### b) Install dependencies

```bash
pip install -r requirements.txt
```

#### c) Configure environment variables

Create a `.env.local` file inside the `backend/` directory:

```bash
# backend/.env.local
GROQ_API_KEY=your_groq_api_key_here
```

> **Get your free Groq API key at** [console.groq.com](https://console.groq.com)

#### d) Start the backend server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be live at → **http://localhost:8000**
Interactive docs at → **http://localhost:8000/docs**

---

### 🎨 3 — Frontend Setup

Open a **new terminal** from the project root:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be live at → **http://localhost:5173**

---

### ✅ 4 — You're Ready!

Open **http://localhost:5173** in your browser, add a database connection, and start querying with AI.

---

## 📁 Project Structure

```
SmartQuery_AI/
├── 📄 README.md
├── 📄 PRD.md                          ← Product Requirements Document
├── 🔒 .gitignore
│
├── backend/
│   ├── app/
│   │   ├── main.py                    ← FastAPI entry point
│   │   ├── config.py                  ← App configuration
│   │   ├── database.py                ← SQLite metadata DB setup
│   │   ├── routers/
│   │   │   ├── connections.py         ← DB connection CRUD
│   │   │   ├── query.py               ← Query execution
│   │   │   ├── schema.py              ← Schema introspection
│   │   │   ├── ai.py                  ← AI endpoints
│   │   │   └── history.py             ← Query history
│   │   ├── services/
│   │   │   ├── db_manager.py          ← Multi-DB driver manager
│   │   │   ├── query_executor.py      ← Executes queries
│   │   │   └── history_service.py     ← History persistence
│   │   ├── ai/
│   │   │   ├── agent.py               ← LangGraph agent
│   │   │   ├── nodes.py               ← Agent nodes
│   │   │   ├── tools.py               ← Agent tools
│   │   │   └── prompts.py             ← LLM prompts
│   │   └── models/
│   │       ├── connection.py
│   │       ├── query.py
│   │       └── history.py
│   ├── requirements.txt
│   └── .env.local                     ← 🔒 gitignored — your secrets here
│
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── api/                        ← Axios API client
    │   └── components/                 ← UI components
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.ts
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key for AI features |

> **Note:** The `.env.local` file is listed in `.gitignore` and will **never** be committed to version control. Your API keys are safe.

---

## 🤖 AI Agent Architecture

The AI system is built with **LangGraph** and powered by **Groq's LLaMA 3.3-70B** model:

```
User Input (natural language)
        ↓
  [ Router Node ] ─── classifies intent ───────────────────┐
        │                                                   │
   ┌────┴──────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
   │  Schema   │  │  Query   │  │ Optimize │  │  Error   ││
   │  Fetcher  │  │   Gen    │  │   Node   │  │  Fixer   ││
   └────┬──────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘│
        └──────────────┴─────────────┴──────────────┘      │
                              ↓                             │
                  [ Response Formatter ]◄────────────────────┘
              (query + explanation + confidence)
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/connections` | List saved connections |
| `POST` | `/api/connections` | Add new connection |
| `POST` | `/api/connections/{id}/test` | Test connectivity |
| `POST` | `/api/query/execute` | Execute a raw query |
| `GET` | `/api/schema/{id}/tables` | List tables/collections |
| `POST` | `/api/ai/nl-to-query` | Natural language → query |
| `POST` | `/api/ai/explain-results` | Explain results in English |
| `POST` | `/api/ai/optimize` | Get optimization suggestions |
| `POST` | `/api/ai/fix-error` | Auto-fix a failed query |
| `GET` | `/api/history` | Get query history |
| `GET` | `/api/health` | Health check |

Full interactive docs: **http://localhost:8000/docs**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TypeScript, TailwindCSS 4 |
| **UI Components** | CodeMirror 6, Lucide React, React Icons |
| **State Management** | Zustand |
| **HTTP Client** | Axios |
| **Backend** | FastAPI, Python 3.12, Uvicorn |
| **AI Agent** | LangGraph, LangChain, Groq API |
| **LLM** | LLaMA 3.3-70B (via Groq) |
| **DB Drivers** | psycopg2 (PostgreSQL), pymongo (MongoDB), oracledb (Oracle) |
| **App Metadata** | SQLite + aiosqlite + SQLAlchemy |

---

## ⚠️ Requirements & Constraints

- **Groq API Key** is required for all AI features (raw queries work offline)
- **Oracle Instant Client** must be installed for Oracle connectivity
- This is a **local-only** tool — no cloud deployment, no multi-user support
- DB drivers are optional — the app detects which ones are available on your system

---

<div align="center">

Made with ❤️ for **EDI Sem 4** · Lexis

</div>
