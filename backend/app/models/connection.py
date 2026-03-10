from sqlalchemy import Column, Integer, String, DateTime, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import Base


# SQLAlchemy ORM model
class ConnectionORM(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    db_type = Column(String, nullable=False)  # postgresql | mongodb | oracle
    config = Column(String, nullable=False)    # JSON string
    created_at = Column(DateTime, default=func.now())
    last_used = Column(DateTime, nullable=True)


# Pydantic schemas
class ConnectionConfig(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    database: Optional[str] = None
    uri: Optional[str] = None


class ConnectionCreate(BaseModel):
    name: str
    db_type: str  # postgresql | mongodb | oracle
    config: ConnectionConfig


class ConnectionUpdate(BaseModel):
    name: Optional[str] = None
    db_type: Optional[str] = None
    config: Optional[ConnectionConfig] = None


class ConnectionResponse(BaseModel):
    id: int
    name: str
    db_type: str
    config: ConnectionConfig
    created_at: datetime
    last_used: Optional[datetime] = None

    class Config:
        from_attributes = True
