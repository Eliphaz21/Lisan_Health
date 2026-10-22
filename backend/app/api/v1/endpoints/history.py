"""
User Clinical Report History endpoints.
Allows logged-in patients and clinicians to save, review, and delete previous report explanations.
"""

from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import get_current_user
from backend.app.db.session import get_db
from backend.app.db.models import User, ReportRecord
from backend.app.schemas.auth import SaveReportRequest, ReportRecordResponse

router = APIRouter(prefix="/history", tags=["User Report History"])


@router.post(
    "/save",
    response_model=ReportRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save Clinical Report to User History",
    description="Stores the analyzed report and localized explanation in the user's medical history."
)
async def save_report(
    payload: SaveReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportRecordResponse:
    """Saves a report explanation under current user account."""
    record = ReportRecord(
        user_id=current_user.id,
        report_id=payload.report_id,
        panel_name=payload.panel_name,
        language=payload.language,
        raw_text=payload.raw_text,
        extracted_json=payload.extracted_json,
        explanation_json=payload.explanation_json,
        audio_url=payload.audio_url,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return ReportRecordResponse.model_validate(record)


@router.get(
    "",
    response_model=List[ReportRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="Get User Report History",
    description="Returns all previously saved reports for the authenticated user."
)
async def get_user_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ReportRecordResponse]:
    """Retrieves all reports for logged-in user."""
    result = await db.execute(
        select(ReportRecord)
        .where(ReportRecord.user_id == current_user.id)
        .order_by(ReportRecord.created_at.desc())
    )
    records = result.scalars().all()
    return [ReportRecordResponse.model_validate(r) for r in records]


@router.delete(
    "/{record_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Saved Report",
    description="Deletes a report from user's history."
)
async def delete_saved_report(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """Removes a report from user history."""
    result = await db.execute(
        select(ReportRecord).where(
            ReportRecord.id == record_id,
            ReportRecord.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report record not found.")

    await db.delete(record)
    await db.commit()
    return {"message": "Report record deleted successfully."}
