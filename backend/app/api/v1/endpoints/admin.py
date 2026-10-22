"""
Admin Management Endpoints (Protected by Role-Based Access Control).
Provides full CRUD on users, system observability stats, and runtime API key configuration.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.security import get_current_active_admin
from backend.app.db.session import get_db, engine
from backend.app.db.models import User, ReportRecord, SystemConfig
from backend.app.schemas.auth import (
    UserResponse,
    UserUpdateRole,
    UserUpdateStatus,
)

router = APIRouter(prefix="/admin", tags=["Administrator Dashboard"])


@router.get(
    "/users",
    response_model=List[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List All Registered Users",
    description="Returns all registered users in the platform. Admin authorization required."
)
async def list_users(
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
) -> List[UserResponse]:
    """Lists all users for admin management."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.put(
    "/users/{user_id}/role",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update User Role (USER or ADMIN)",
    description="Promotes or demotes user role. Admin authorization required."
)
async def update_user_role(
    user_id: str,
    payload: UserUpdateRole,
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Updates user role."""
    target_role = payload.role.upper().strip()
    if target_role not in ["USER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'USER' or 'ADMIN'.",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.role = target_role
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.put(
    "/users/{user_id}/status",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate or Deactivate User Account",
    description="Enables or disables user access to platform."
)
async def update_user_status(
    user_id: str,
    payload: UserUpdateStatus,
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Toggles account active state."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own active admin account.",
        )

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete User Account",
    description="Permanently removes a user account from database."
)
async def delete_user(
    user_id: str,
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """Deletes user account."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own active admin account.",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    await db.delete(user)
    await db.commit()
    return {"message": f"User {user.email} successfully deleted."}


@router.get(
    "/stats",
    status_code=status.HTTP_200_OK,
    summary="Get Platform Statistics and Monitoring Overview",
    description="Returns user count, report analytics, and system runtime information."
)
async def get_platform_stats(
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Computes administrative metrics."""
    # Count users
    total_users_res = await db.execute(select(func.count(User.id)))
    total_users = total_users_res.scalar() or 0

    admin_users_res = await db.execute(select(func.count(User.id)).where(User.role == "ADMIN"))
    admin_users = admin_users_res.scalar() or 0

    # Count reports
    total_reports_res = await db.execute(select(func.count(ReportRecord.id)))
    total_reports = total_reports_res.scalar() or 0

    # Reports by language
    am_reports_res = await db.execute(select(func.count(ReportRecord.id)).where(ReportRecord.language == "am"))
    am_reports = am_reports_res.scalar() or 0

    om_reports_res = await db.execute(select(func.count(ReportRecord.id)).where(ReportRecord.language == "om"))
    om_reports = om_reports_res.scalar() or 0

    en_reports_res = await db.execute(select(func.count(ReportRecord.id)).where(ReportRecord.language == "en"))
    en_reports = en_reports_res.scalar() or 0

    db_driver = engine.url.drivername if engine else "unknown"

    return {
        "users": {
            "total": total_users,
            "admins": admin_users,
            "patients": total_users - admin_users,
        },
        "reports": {
            "total": total_reports,
            "amharic": am_reports,
            "afaan_oromoo": om_reports,
            "english": en_reports,
        },
        "infrastructure": {
            "database_driver": db_driver,
            "is_postgres": "postgres" in db_driver,
            "environment": settings.ENVIRONMENT,
            "tts_enabled": settings.ADDIS_AI_TTS_ENABLED,
            "reasoning_provider": settings.REASONING_PROVIDER,
        }
    }


def mask_key(k: str) -> str:
    """Masks secret API key for safe UI display."""
    if not k or len(k) < 12:
        return "Not Configured"
    return f"{k[:8]}...{k[-4:]}"


@router.get(
    "/settings",
    status_code=status.HTTP_200_OK,
    summary="Get System and AI Provider Settings",
    description="Returns active AI provider configurations with sensitive secrets masked."
)
async def get_system_settings(
    admin: User = Depends(get_current_active_admin),
) -> Dict[str, Any]:
    """Returns masked system configuration."""
    return {
        "admin_email": settings.ADMIN_EMAIL,
        "environment": settings.ENVIRONMENT,
        "database_url_target": "AletCloud PostgreSQL 17 (196.190.212.135:54382)" if "196" in settings.DATABASE_URL else settings.DATABASE_URL,
        "addis_ai": {
            "base_url": settings.ADDIS_AI_BASE_URL,
            "api_key_masked": mask_key(settings.ADDIS_AI_API_KEY),
            "is_configured": bool(settings.ADDIS_AI_API_KEY),
            "text_model": settings.ADDIS_AI_TEXT_MODEL,
            "tts_voice_am": settings.ADDIS_AI_TTS_DEFAULT_VOICE_AM,
            "tts_voice_om": settings.ADDIS_AI_TTS_DEFAULT_VOICE_OM,
        },
        "provider_a": {
            "provider": settings.REASONING_PROVIDER,
            "model": settings.REASONING_MODEL,
            "api_key_masked": mask_key(settings.REASONING_API_KEY),
            "is_configured": bool(settings.REASONING_API_KEY),
        }
    }
