"""
Pydantic schemas for User Authentication, Profiles, and Admin Management.
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """User registration payload."""
    email: EmailStr = Field(..., description="Valid user email address")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    password: str = Field(..., min_length=8, description="Secure password (minimum 8 characters)")


class UserLogin(BaseModel):
    """User login credential payload."""
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    """Public user profile response."""
    id: str
    email: str
    full_name: str
    role: str  # "USER" or "ADMIN"
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """JWT bearer token and authenticated user payload."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdateRole(BaseModel):
    """Admin request to change user role."""
    role: str = Field(..., description="'USER' or 'ADMIN'")


class UserUpdateStatus(BaseModel):
    """Admin request to activate or deactivate user."""
    is_active: bool


class SaveReportRequest(BaseModel):
    """Payload to save an explained clinical report to user history."""
    report_id: str
    panel_name: str
    language: str = "am"
    raw_text: Optional[str] = None
    extracted_json: str
    explanation_json: str
    audio_url: Optional[str] = None


class ReportRecordResponse(BaseModel):
    """Saved clinical report record for history view."""
    id: str
    report_id: str
    panel_name: str
    language: str
    raw_text: Optional[str]
    extracted_json: str
    explanation_json: str
    audio_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
