from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.connection import ConnectionORM, ConnectionConfig
from app.ai.agent import agent
from app.ai.tools import get_schema_context
from app.services.query_executor import execute_query
from app.services.history_service import add_history

router = APIRouter(prefix="/api/ai", tags=["ai"])


class NLQueryRequest(BaseModel):
    connection_id: int
    prompt: str


class ExplainRequest(BaseModel):
    connection_id: int
    query: str
    results: list[dict] = []


class OptimizeRequest(BaseModel):
    connection_id: int
    query: str


class FixRequest(BaseModel):
    connection_id: int
    query: str
    error: str


class ExploreRequest(BaseModel):
    connection_id: int
    question: str


class AIResponse(BaseModel):
    intent: Optional[str] = None
    generated_query: Optional[str] = None
    fixed_query: Optional[str] = None
    explanation: Optional[str] = None
    optimization: Optional[str] = None
    executed_result: Optional[dict] = None
    error: Optional[str] = None


async def _get_conn_and_schema(conn_id: int, db: AsyncSession):
    result = await db.execute(select(ConnectionORM).where(ConnectionORM.id == conn_id))
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(404, "Connection not found")
    config = ConnectionConfig.model_validate_json(conn.config)
    schema = get_schema_context(conn.db_type, config)
    return conn, config, schema


@router.post("/nl-to-query", response_model=AIResponse)
async def nl_to_query(data: NLQueryRequest, db: AsyncSession = Depends(get_db)):
    """Convert natural language to a database query and optionally execute it."""
    try:
        conn, config, schema = await _get_conn_and_schema(data.connection_id, db)

        state = {
            "user_input": data.prompt,
            "db_type": conn.db_type,
            "schema": schema,
        }
        result = agent.invoke(state)

        generated = result.get("generated_query")
        response = AIResponse(
            intent=result.get("intent"),
            generated_query=generated,
        )

        # Auto-execute SELECT/find queries
        if generated:
            is_read = _is_read_query(generated, conn.db_type)
            if is_read:
                exec_result = execute_query(conn.db_type, config, generated)
                response.executed_result = exec_result.model_dump()

                # Save to history
                await add_history(
                    db=db,
                    connection_id=conn.id,
                    query_text=generated,
                    query_type="nlp_generated",
                    nl_prompt=data.prompt,
                    status="success" if not exec_result.error else "error",
                    error_message=exec_result.error,
                    execution_ms=exec_result.execution_ms,
                    row_count=exec_result.row_count,
                )

                # If execution failed, try to auto-fix once
                if exec_result.error:
                    fix_state = {
                        "user_input": data.prompt,
                        "db_type": conn.db_type,
                        "schema": schema,
                        "query": generated,
                        "error": exec_result.error,
                        "intent": "fix",
                    }
                    # Run just the fix node
                    from app.ai.nodes import fix_query
                    fix_result = fix_query(fix_state)
                    response.fixed_query = fix_result.get("fixed_query")

        return response

    except Exception as e:
        return AIResponse(error=str(e))


@router.post("/explain-results", response_model=AIResponse)
async def explain_results_endpoint(data: ExplainRequest, db: AsyncSession = Depends(get_db)):
    """Explain query results in plain English."""
    try:
        conn, config, schema = await _get_conn_and_schema(data.connection_id, db)
        state = {
            "user_input": "Explain these results",
            "db_type": conn.db_type,
            "schema": schema,
            "query": data.query,
            "results_preview": data.results,
            "intent": "explain",
        }
        from app.ai.nodes import explain_results
        result = explain_results(state)
        return AIResponse(explanation=result.get("explanation"))
    except Exception as e:
        return AIResponse(error=str(e))


@router.post("/optimize", response_model=AIResponse)
async def optimize_endpoint(data: OptimizeRequest, db: AsyncSession = Depends(get_db)):
    """Suggest query optimizations."""
    try:
        conn, config, schema = await _get_conn_and_schema(data.connection_id, db)
        state = {
            "user_input": "Optimize this query",
            "db_type": conn.db_type,
            "schema": schema,
            "query": data.query,
            "intent": "optimize",
        }
        from app.ai.nodes import optimize_query
        result = optimize_query(state)
        return AIResponse(optimization=result.get("optimization"))
    except Exception as e:
        return AIResponse(error=str(e))


@router.post("/fix-error", response_model=AIResponse)
async def fix_error_endpoint(data: FixRequest, db: AsyncSession = Depends(get_db)):
    """Fix a broken query."""
    try:
        conn, config, schema = await _get_conn_and_schema(data.connection_id, db)
        state = {
            "user_input": "Fix this query",
            "db_type": conn.db_type,
            "schema": schema,
            "query": data.query,
            "error": data.error,
            "intent": "fix",
        }
        from app.ai.nodes import fix_query
        result = fix_query(state)
        return AIResponse(fixed_query=result.get("fixed_query"))
    except Exception as e:
        return AIResponse(error=str(e))


@router.post("/explore-schema", response_model=AIResponse)
async def explore_schema_endpoint(data: ExploreRequest, db: AsyncSession = Depends(get_db)):
    """Answer questions about the database schema."""
    try:
        conn, config, schema = await _get_conn_and_schema(data.connection_id, db)
        state = {
            "user_input": data.question,
            "db_type": conn.db_type,
            "schema": schema,
            "intent": "explore",
        }
        from app.ai.nodes import explore_schema
        result = explore_schema(state)
        return AIResponse(explanation=result.get("explanation"))
    except Exception as e:
        return AIResponse(error=str(e))


def _is_read_query(query: str, db_type: str) -> bool:
    """Check if a query is read-only (safe to auto-execute)."""
    if db_type == "mongodb":
        import json
        try:
            cmd = json.loads(query)
            return cmd.get("method", "find") in ("find", "aggregate", "countDocuments")
        except json.JSONDecodeError:
            return False
    # SQL
    q = query.strip().upper()
    return q.startswith("SELECT") or q.startswith("WITH") or q.startswith("EXPLAIN")
