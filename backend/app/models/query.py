from pydantic import BaseModel
from typing import Optional, Any


class QueryRequest(BaseModel):
    connection_id: int
    query: str


class QueryResult(BaseModel):
    columns: Optional[list[str]] = None  # For SQL results
    rows: Optional[list[dict[str, Any]]] = None  # For SQL results
    documents: Optional[list[dict[str, Any]]] = None  # For MongoDB results
    row_count: int = 0
    execution_ms: int = 0
    db_type: str = ""
    error: Optional[str] = None
