from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import Base


class QueryHistoryORM(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    connection_id = Column(Integer, ForeignKey("connections.id", ondelete="CASCADE"))
    query_text = Column(String, nullable=False)
    query_type = Column(String, nullable=False, default="raw")  # raw | nlp_generated
    nl_prompt = Column(String, nullable=True)
    status = Column(String, nullable=False)  # success | error
    error_message = Column(String, nullable=True)
    execution_ms = Column(Integer, nullable=True)
    row_count = Column(Integer, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())


class HistoryResponse(BaseModel):
    id: int
    connection_id: int
    query_text: str
    query_type: str
    nl_prompt: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    execution_ms: Optional[int] = None
    row_count: Optional[int] = None
    is_favorite: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
