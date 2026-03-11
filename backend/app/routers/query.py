import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.connection import ConnectionORM, ConnectionConfig
from app.models.query import QueryRequest, QueryResult
from app.services.query_executor import execute_query
from app.services.history_service import add_history

router = APIRouter(prefix="/api/query", tags=["query"])


@router.post("/execute", response_model=QueryResult)
async def run_query(data: QueryRequest, db: AsyncSession = Depends(get_db)):
    # Fetch connection
    result = await db.execute(select(ConnectionORM).where(ConnectionORM.id == data.connection_id))
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(404, "Connection not found")

    config = ConnectionConfig.model_validate_json(conn.config)

    # Execute (in thread to avoid blocking the asyncio event loop)
    query_result = await asyncio.to_thread(execute_query, conn.db_type, config, data.query)

    # Update last_used
    conn.last_used = func.now()
    await db.commit()

    # Save to history
    await add_history(
        db=db,
        connection_id=conn.id,
        query_text=data.query,
        query_type="raw",
        status="success" if not query_result.error else "error",
        error_message=query_result.error,
        execution_ms=query_result.execution_ms,
        row_count=query_result.row_count,
    )

    return query_result
