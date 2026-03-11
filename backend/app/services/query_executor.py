import time
import json
from typing import Any
from bson import ObjectId

from app.models.connection import ConnectionConfig
from app.models.query import QueryResult
from app.services.db_manager import get_connection


class JSONEncoder(json.JSONEncoder):
    """Custom encoder to handle MongoDB ObjectId and other non-serializable types."""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        if isinstance(obj, bytes):
            return obj.hex()
        return super().default(obj)


def execute_query(db_type: str, config: ConnectionConfig, query: str) -> QueryResult:
    """Execute a query against the specified database."""
    start = time.time()

    try:
        if db_type in ("postgresql", "mysql", "oracle"):
            return _execute_sql(db_type, config, query, start)
        elif db_type == "mongodb":
            return _execute_mongodb(config, query, start)
        else:
            return QueryResult(error=f"Unsupported database type: {db_type}", db_type=db_type)
    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        return QueryResult(error=str(e), execution_ms=elapsed, db_type=db_type)


def _execute_sql(db_type: str, config: ConnectionConfig, query: str, start: float) -> QueryResult:
    """Execute SQL query (PostgreSQL or Oracle)."""
    conn = get_connection(db_type, config)
    try:
        cursor = conn.cursor()
        cursor.execute(query)

        # Check if query returns rows (SELECT, etc.)
        if cursor.description:
            columns = [desc[0] for desc in cursor.description]
            raw_rows = cursor.fetchall()
            rows = [dict(zip(columns, row)) for row in raw_rows]
            elapsed = int((time.time() - start) * 1000)
            return QueryResult(
                columns=columns,
                rows=rows,
                row_count=len(rows),
                execution_ms=elapsed,
                db_type=db_type,
            )
        else:
            conn.commit()
            affected = cursor.rowcount
            elapsed = int((time.time() - start) * 1000)
            return QueryResult(
                row_count=affected,
                execution_ms=elapsed,
                db_type=db_type,
            )
    finally:
        conn.close()


def _execute_mongodb(config: ConnectionConfig, query: str, start: float) -> QueryResult:
    """Execute a MongoDB query. Expects JSON-like command format:

    Supported formats:
      {"collection": "users", "method": "find", "filter": {"age": {"$gt": 25}}}
      {"collection": "users", "method": "insertOne", "document": {...}}
      {"collection": "users", "method": "aggregate", "pipeline": [...]}
    """
    client, db = get_connection("mongodb", config)
    try:
        cmd = json.loads(query)
        collection_name = cmd.get("collection")
        if not collection_name:
            return QueryResult(error="MongoDB query must include 'collection' field", db_type="mongodb")

        collection = db[collection_name]
        method = cmd.get("method", "find")

        if method == "find":
            filter_doc = cmd.get("filter", {})
            projection = cmd.get("projection", None)
            limit = cmd.get("limit", 100)
            cursor = collection.find(filter_doc, projection).limit(limit)
            docs = json.loads(JSONEncoder().encode(list(cursor)))
            elapsed = int((time.time() - start) * 1000)
            return QueryResult(documents=docs, row_count=len(docs), execution_ms=elapsed, db_type="mongodb")

        elif method == "aggregate":
            pipeline = cmd.get("pipeline", [])
            cursor = collection.aggregate(pipeline)
            docs = json.loads(JSONEncoder().encode(list(cursor)))
            elapsed = int((time.time() - start) * 1000)
            return QueryResult(documents=docs, row_count=len(docs), execution_ms=elapsed, db_type="mongodb")

        elif method == "insertOne":
            doc = cmd.get("document", {})
            result = collection.insert_one(doc)
            elapsed = int((time.time() - start) * 1000)
            return QueryResult(row_count=1, execution_ms=elapsed, db_type="mongodb",
                             documents=[{"insertedId": str(result.inserted_id)}])

        elif method == "insertMany":
            docs = cmd.get("documents", [])
            result = collection.insert_many(docs)
            elapsed = int((time.time() - start) * 1000)
            return QueryResult(row_count=len(result.inserted_ids), execution_ms=elapsed, db_type="mongodb")

        elif method == "updateMany":
            filter_doc = cmd.get("filter", {})
            update = cmd.get("update", {})
            result = collection.update_many(filter_doc, update)
            elapsed = int((time.time() - start) * 1000)
            return QueryResult(row_count=result.modified_count, execution_ms=elapsed, db_type="mongodb")

        elif method == "deleteMany":
            filter_doc = cmd.get("filter", {})
            result = collection.delete_many(filter_doc)
            elapsed = int((time.time() - start) * 1000)
            return QueryResult(row_count=result.deleted_count, execution_ms=elapsed, db_type="mongodb")

        elif method == "countDocuments":
            filter_doc = cmd.get("filter", {})
            count = collection.count_documents(filter_doc)
            elapsed = int((time.time() - start) * 1000)
            return QueryResult(row_count=count, execution_ms=elapsed, db_type="mongodb",
                             documents=[{"count": count}])

        else:
            return QueryResult(error=f"Unsupported MongoDB method: {method}", db_type="mongodb")

    finally:
        client.close()
