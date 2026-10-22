"""
Database models for User Authentication, Clinical History, and System Configuration.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """User account entity with Role-Based Access Control (USER vs ADMIN)."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="USER", nullable=False)  # "USER" or "ADMIN"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    reports = relationship("ReportRecord", back_populates="user", cascade="all, delete-orphan")


class ReportRecord(Base):
    """Saved patient laboratory explanation history record."""
    __tablename__ = "report_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    report_id = Column(String(100), nullable=False)
    panel_name = Column(String(255), nullable=False)
    language = Column(String(10), default="am", nullable=False)  # 'am', 'om', 'en'
    raw_text = Column(Text, nullable=True)
    extracted_json = Column(Text, nullable=False)
    explanation_json = Column(Text, nullable=False)
    audio_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="reports")


class SystemConfig(Base):
    """Dynamic system configuration and API provider key overrides (Admin-managed)."""
    __tablename__ = "system_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
