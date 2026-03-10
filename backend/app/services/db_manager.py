import importlib
import json
from typing import Any

from app.models.connection import ConnectionConfig


def detect_available_drivers() -> dict[str, bool]:
    """Check which database drivers are installed on the system."""
    drivers = {
        "postgresql": "psycopg2",
        "mongodb": "pymongo",
        "oracle": "oracledb",
    }
    result = {}
    for db_type, module_name in drivers.items():
        try:
            importlib.import_module(module_name)
            result[db_type] = True
        except ImportError:
            result[db_type] = False
    return result


def build_connection_params(db_type: str, config: ConnectionConfig) -> dict[str, Any]:
    """Build connection parameters from config."""
    if config.uri:
        return {"uri": config.uri}

    if db_type == "postgresql":
        return {
            "host": config.host or "localhost",
            "port": config.port or 5432,
            "user": config.username or "postgres",
            "password": config.password or "",
            "dbname": config.database or "postgres",
        }
    elif db_type == "mongodb":
        host = config.host or "localhost"
        port = config.port or 27017
        return {"uri": f"mongodb://{config.username}:{config.password}@{host}:{port}/{config.database or 'admin'}"}
    elif db_type == "oracle":
        return {
            "user": config.username or "",
            "password": config.password or "",
            "dsn": f"{config.host or 'localhost'}:{config.port or 1521}/{config.database or 'ORCL'}",
        }
    raise ValueError(f"Unsupported database type: {db_type}")


def test_connection(db_type: str, config: ConnectionConfig) -> tuple[bool, str]:
    """Test a database connection. Returns (success, message)."""
    try:
        params = build_connection_params(db_type, config)

        if db_type == "postgresql":
            import psycopg2
            if "uri" in params:
                conn = psycopg2.connect(params["uri"])
            else:
                conn = psycopg2.connect(**params)
            conn.close()
            return True, "Connection successful"

        elif db_type == "mongodb":
            from pymongo import MongoClient
            uri = params.get("uri", "mongodb://localhost:27017")
            client = MongoClient(uri, serverSelectionTimeoutMS=5000)
            client.admin.command("ping")
            client.close()
            return True, "Connection successful"

        elif db_type == "oracle":
            import oracledb
            if "uri" in params:
                conn = oracledb.connect(dsn=params["uri"])
            else:
                conn = oracledb.connect(**params)
            conn.close()
            return True, "Connection successful"

        return False, f"Unsupported database type: {db_type}"

    except Exception as e:
        return False, str(e)


def get_connection(db_type: str, config: ConnectionConfig):
    """Create and return a database connection."""
    params = build_connection_params(db_type, config)

    if db_type == "postgresql":
        import psycopg2
        if "uri" in params:
            return psycopg2.connect(params["uri"])
        return psycopg2.connect(**params)

    elif db_type == "mongodb":
        from pymongo import MongoClient
        uri = params.get("uri", "mongodb://localhost:27017")
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        db_name = config.database or "admin"
        if config.uri:
            # Extract db name from URI
            from urllib.parse import urlparse
            parsed = urlparse(config.uri)
            db_name = parsed.path.lstrip("/") or "admin"
        return client, client[db_name]

    elif db_type == "oracle":
        import oracledb
        if "uri" in params:
            return oracledb.connect(dsn=params["uri"])
        return oracledb.connect(**params)

    raise ValueError(f"Unsupported database type: {db_type}")
