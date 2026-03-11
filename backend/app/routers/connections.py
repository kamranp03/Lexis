import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.connection import (
    ConnectionORM, ConnectionCreate, ConnectionUpdate,
    ConnectionResponse, ConnectionConfig,
)
from app.services.db_manager import detect_available_drivers, test_connection

router = APIRouter(prefix="/api/connections", tags=["connections"])


@router.get("/drivers")
async def get_drivers():
    """Check which database drivers are available on the system."""
    return detect_available_drivers()


@router.get("", response_model=list[ConnectionResponse])
async def list_connections(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ConnectionORM).order_by(ConnectionORM.created_at.desc()))
    connections = result.scalars().all()
    return [_orm_to_response(c) for c in connections]


@router.post("", response_model=ConnectionResponse)
async def create_connection(data: ConnectionCreate, db: AsyncSession = Depends(get_db)):
    if data.db_type not in ("postgresql", "mysql", "mongodb", "oracle"):
        raise HTTPException(400, "db_type must be postgresql, mysql, mongodb, or oracle")

    conn = ConnectionORM(
        name=data.name,
        db_type=data.db_type,
        config=data.config.model_dump_json(),
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return _orm_to_response(conn)


@router.put("/{conn_id}", response_model=ConnectionResponse)
async def update_connection(conn_id: int, data: ConnectionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ConnectionORM).where(ConnectionORM.id == conn_id))
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(404, "Connection not found")

    if data.name is not None:
        conn.name = data.name
    if data.db_type is not None:
        conn.db_type = data.db_type
    if data.config is not None:
        conn.config = data.config.model_dump_json()

    await db.commit()
    await db.refresh(conn)
    return _orm_to_response(conn)


@router.delete("/{conn_id}")
async def delete_connection(conn_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ConnectionORM).where(ConnectionORM.id == conn_id))
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(404, "Connection not found")
    await db.delete(conn)
    await db.commit()
    return {"ok": True}


@router.post("/{conn_id}/test")
async def test_conn(conn_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ConnectionORM).where(ConnectionORM.id == conn_id))
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(404, "Connection not found")

    config = ConnectionConfig.model_validate_json(conn.config)
    success, message = await asyncio.to_thread(test_connection, conn.db_type, config)
    return {"success": success, "message": message}


def _orm_to_response(conn: ConnectionORM) -> ConnectionResponse:
    config = ConnectionConfig.model_validate_json(conn.config)
    return ConnectionResponse(
        id=conn.id,
        name=conn.name,
        db_type=conn.db_type,
        config=config,
        created_at=conn.created_at,
        last_used=conn.last_used,
    )
