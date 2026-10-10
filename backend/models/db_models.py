from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from database import Base

IST = timezone(timedelta(hours=5, minutes=30))


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    district = Column(String, nullable=False)
    soil_type = Column(String, nullable=False)
    acreage = Column(Float, nullable=False)
    primary_crop = Column(String, nullable=False)
    preferred_language = Column(String, default="English")

    sessions = relationship("AgentSessionLog", back_populates="user")


class AgentSessionLog(Base):
    __tablename__ = "agent_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    query_text = Column(String, nullable=False)
    tools_executed = Column(JSON, default=[])
    final_output = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(IST))

    user = relationship("User", back_populates="sessions")
