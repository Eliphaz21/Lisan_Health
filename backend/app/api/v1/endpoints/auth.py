"""
Authentication endpoints: Registration, Login, and Current User Profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from backend.app.db.session import get_db
from backend.app.db.models import User
from backend.app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["User Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User Account",
    description="Registers a new patient or clinician account. Automatically assigns ADMIN role to designated administrator email."
)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Registers a new user and generates a JWT access token."""
    email_clean = payload.email.lower().strip()

    # Check existing user
    existing = await db.execute(select(User).where(User.email == email_clean))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Determine role: eliphazyab@gmail.com is automatically ADMIN
    user_role = "ADMIN" if email_clean == settings.ADMIN_EMAIL.lower().strip() else "USER"

    new_user = User(
        email=email_clean,
        full_name=payload.full_name.strip(),
        hashed_password=get_password_hash(payload.password),
        role=user_role,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(subject=new_user.id, role=new_user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate User & Issue JWT",
    description="Validates email and password credentials and returns a secure JWT bearer token."
)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticates credentials and returns a signed token."""
    email_clean = payload.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email_clean))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended. Please contact system support.",
        )

    token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Authenticated User Profile",
    description="Returns profile and role data for the currently authenticated user."
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Returns profile of currently logged in user."""
    return UserResponse.model_validate(current_user)
