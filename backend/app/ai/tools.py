"""Helper functions used by AI agent nodes to fetch schema context."""

import json
from app.models.connection import ConnectionConfig
from app.services.db_manager import get_connection


def get_schema_context(db_type: str, config: ConnectionConfig) -> str:
    """Fetch a text representation of the database schema for LLM context."""
    try:
        if db_type == "postgresql":
            return _pg_schema(config)
        elif db_type == "oracle":
            return _oracle_schema(config)
        elif db_type == "mongodb":
            return _mongo_schema(config)
        return "Unknown database type"
    except Exception as e:
        return f"Error fetching schema: {e}"


def _pg_schema(config: ConnectionConfig) -> str:
    conn = get_connection("postgresql", config)
    try:
        cur = conn.cursor()
        # Get all tables and their columns
        cur.execute("""
            SELECT t.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
            WHERE t.table_schema = 'public'
            ORDER BY t.table_name, c.ordinal_position
        """)
        rows = cur.fetchall()

        # Get foreign keys
        cur.execute("""
            SELECT tc.table_name, kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        """)
        fkeys = cur.fetchall()

        # Build schema text
        tables: dict[str, list[str]] = {}
        for table, col, dtype, nullable, default in rows:
            if table not in tables:
                tables[table] = []
            null_str = "NULL" if nullable == "YES" else "NOT NULL"
            tables[table].append(f"  {col} {dtype} {null_str}")

        lines = []
        for table, cols in tables.items():
            lines.append(f"TABLE {table}:")
            lines.extend(cols)
            # Add FK info
            for fk in fkeys:
                if fk[0] == table:
                    lines.append(f"  FK: {fk[1]} -> {fk[2]}.{fk[3]}")
            lines.append("")

        return "\n".join(lines) if lines else "No tables found"
    finally:
        conn.close()


def _oracle_schema(config: ConnectionConfig) -> str:
    conn = get_connection("oracle", config)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT table_name, column_name, data_type, nullable
            FROM user_tab_columns
            ORDER BY table_name, column_id
        """)
        rows = cur.fetchall()

        tables: dict[str, list[str]] = {}
        for table, col, dtype, nullable in rows:
            if table not in tables:
                tables[table] = []
            null_str = "NULL" if nullable == "Y" else "NOT NULL"
            tables[table].append(f"  {col} {dtype} {null_str}")

        lines = []
        for table, cols in tables.items():
            lines.append(f"TABLE {table}:")
            lines.extend(cols)
            lines.append("")

        return "\n".join(lines) if lines else "No tables found"
    finally:
        conn.close()


def _mongo_schema(config: ConnectionConfig) -> str:
    client, db = get_connection("mongodb", config)
    try:
        collections = db.list_collection_names()
        lines = []
        for coll_name in sorted(collections):
            coll = db[coll_name]
            sample = coll.find_one()
            lines.append(f"COLLECTION {coll_name}:")
            if sample:
                for key, val in sample.items():
                    lines.append(f"  {key}: {type(val).__name__}")
            else:
                lines.append("  (empty collection)")
            lines.append("")
        return "\n".join(lines) if lines else "No collections found"
    finally:
        client.close()
