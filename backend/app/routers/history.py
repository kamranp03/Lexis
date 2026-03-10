from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.history import HistoryResponse
from app.services.history_service import get_history, toggle_favorite, delete_history

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryResponse])
async def list_history(
    connection_id: int | None = None,
    favorites_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    entries = await get_history(db, connection_id, favorites_only, limit, offset)
    return entries


@router.post("/{history_id}/favorite", response_model=HistoryResponse)
async def toggle_fav(history_id: int, db: AsyncSession = Depends(get_db)):
    entry = await toggle_favorite(db, history_id)
    if not entry:
        raise HTTPException(404, "History entry not found")
    return entry


@router.delete("/{history_id}")
async def delete_entry(history_id: int, db: AsyncSession = Depends(get_db)):
    ok = await delete_history(db, history_id)
    if not ok:
        raise HTTPException(404, "History entry not found")
    return {"ok": True}
