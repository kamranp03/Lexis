from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.connection import ConnectionORM, ConnectionConfig
from app.services.db_manager import get_connection

router = APIRouter(prefix="/api/schema", tags=["schema"])


@router.get("/{conn_id}/tables")
async def list_tables(conn_id: int, db: AsyncSession = Depends(get_db)):
    conn_orm = await _get_conn(conn_id, db)
    config = ConnectionConfig.model_validate_json(conn_orm.config)

    if conn_orm.db_type == "postgresql":
        return _pg_list_tables(config)
    elif conn_orm.db_type == "oracle":
        return _oracle_list_tables(config)
    elif conn_orm.db_type == "mongodb":
        return _mongo_list_collections(config)
    raise HTTPException(400, "Unsupported db type")


@router.get("/{conn_id}/tables/{table_name}")
async def table_detail(conn_id: int, table_name: str, db: AsyncSession = Depends(get_db)):
    conn_orm = await _get_conn(conn_id, db)
    config = ConnectionConfig.model_validate_json(conn_orm.config)

    if conn_orm.db_type == "postgresql":
        return _pg_table_detail(config, table_name)
    elif conn_orm.db_type == "oracle":
        return _oracle_table_detail(config, table_name)
    elif conn_orm.db_type == "mongodb":
        return _mongo_collection_detail(config, table_name)
    raise HTTPException(400, "Unsupported db type")


async def _get_conn(conn_id: int, db: AsyncSession) -> ConnectionORM:
    result = await db.execute(select(ConnectionORM).where(ConnectionORM.id == conn_id))
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(404, "Connection not found")
    return conn


# --- PostgreSQL ---

def _pg_list_tables(config: ConnectionConfig) -> list[dict]:
    conn = get_connection("postgresql", config)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        return [{"name": row[0], "type": row[1]} for row in cur.fetchall()]
    finally:
        conn.close()


def _pg_table_detail(config: ConnectionConfig, table_name: str) -> dict:
    conn = get_connection("postgresql", config)
    try:
        cur = conn.cursor()
        # Columns
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        columns = [
            {"name": r[0], "type": r[1], "nullable": r[2] == "YES", "default": r[3]}
            for r in cur.fetchall()
        ]

        # Indexes
        cur.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = %s AND schemaname = 'public'
        """, (table_name,))
        indexes = [{"name": r[0], "definition": r[1]} for r in cur.fetchall()]

        # Foreign keys
        cur.execute("""
            SELECT
                kcu.column_name,
                ccu.table_name AS foreign_table,
                ccu.column_name AS foreign_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = %s
        """, (table_name,))
        fkeys = [{"column": r[0], "references_table": r[1], "references_column": r[2]} for r in cur.fetchall()]

        return {"name": table_name, "columns": columns, "indexes": indexes, "foreign_keys": fkeys}
    finally:
        conn.close()


# --- Oracle ---

def _oracle_list_tables(config: ConnectionConfig) -> list[dict]:
    conn = get_connection("oracle", config)
    try:
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM user_tables ORDER BY table_name")
        return [{"name": row[0], "type": "BASE TABLE"} for row in cur.fetchall()]
    finally:
        conn.close()


def _oracle_table_detail(config: ConnectionConfig, table_name: str) -> dict:
    conn = get_connection("oracle", config)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name, data_type, nullable, data_default
            FROM user_tab_columns
            WHERE table_name = :tn ORDER BY column_id
        """, {"tn": table_name.upper()})
        columns = [
            {"name": r[0], "type": r[1], "nullable": r[2] == "Y", "default": r[3]}
            for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT index_name, index_type FROM user_indexes WHERE table_name = :tn
        """, {"tn": table_name.upper()})
        indexes = [{"name": r[0], "type": r[1]} for r in cur.fetchall()]

        return {"name": table_name, "columns": columns, "indexes": indexes, "foreign_keys": []}
    finally:
        conn.close()


# --- MongoDB ---

def _mongo_list_collections(config: ConnectionConfig) -> list[dict]:
    client, db = get_connection("mongodb", config)
    try:
        names = db.list_collection_names()
        return [{"name": n, "type": "collection"} for n in sorted(names)]
    finally:
        client.close()


def _mongo_collection_detail(config: ConnectionConfig, collection_name: str) -> dict:
    client, db = get_connection("mongodb", config)
    try:
        coll = db[collection_name]
        # Sample a document to infer fields
        sample = coll.find_one()
        fields = []
        if sample:
            for key, val in sample.items():
                fields.append({"name": key, "type": type(val).__name__})

        indexes = []
        for idx in coll.list_indexes():
            indexes.append({"name": idx.get("name", ""), "keys": dict(idx.get("key", {}))})

        return {"name": collection_name, "columns": fields, "indexes": indexes, "foreign_keys": []}
    finally:
        client.close()
