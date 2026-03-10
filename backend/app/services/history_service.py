from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.history import QueryHistoryORM


async def add_history(
    db: AsyncSession,
    connection_id: int,
    query_text: str,
    query_type: str,
    status: str,
    nl_prompt: str | None = None,
    error_message: str | None = None,
    execution_ms: int | None = None,
    row_count: int | None = None,
) -> QueryHistoryORM:
    entry = QueryHistoryORM(
        connection_id=connection_id,
        query_text=query_text,
        query_type=query_type,
        status=status,
        nl_prompt=nl_prompt,
        error_message=error_message,
        execution_ms=execution_ms,
        row_count=row_count,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_history(
    db: AsyncSession,
    connection_id: int | None = None,
    favorites_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[QueryHistoryORM]:
    stmt = select(QueryHistoryORM).order_by(desc(QueryHistoryORM.created_at))
    if connection_id:
        stmt = stmt.where(QueryHistoryORM.connection_id == connection_id)
    if favorites_only:
        stmt = stmt.where(QueryHistoryORM.is_favorite == True)
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def toggle_favorite(db: AsyncSession, history_id: int) -> QueryHistoryORM | None:
    result = await db.execute(select(QueryHistoryORM).where(QueryHistoryORM.id == history_id))
    entry = result.scalar_one_or_none()
    if not entry:
        return None
    entry.is_favorite = not entry.is_favorite
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_history(db: AsyncSession, history_id: int) -> bool:
    result = await db.execute(select(QueryHistoryORM).where(QueryHistoryORM.id == history_id))
    entry = result.scalar_one_or_none()
    if not entry:
        return False
    await db.delete(entry)
    await db.commit()
    return True
