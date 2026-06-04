from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token, create_refresh_token,
    decode_token, get_password_hash, verify_password,
)
from app.core.password_policy import validate_password, check_password_strength
from app.core.rate_limit import (
    check_login_rate_limit, check_register_rate_limit,
    clear_login_attempts, record_failed_login,
)
from app.api.deps import get_current_user_id
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, TokenResponse, RefreshRequest, UserResponse,
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Rate limit by IP
    await check_register_rate_limit(request)

    # Validate password strength
    try:
        validate_password(payload.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    # Duplicate email check
    stmt = select(User).where(User.email == payload.email.lower())
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu e-posta adresi zaten kayitli.",
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        phone=payload.phone,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    email = form_data.username.lower().strip()

    # Rate limit + lockout check BEFORE DB hit
    await check_login_rate_limit(email, request.client.host if request.client else "")

    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Always run verify_password to prevent timing attacks
    password_ok = user and verify_password(form_data.password, user.hashed_password)

    if not user or not password_ok:
        await record_failed_login(email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya sifre hatali.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesap devre disi birakilmis.",
        )

    # Successful login — clear failed attempts
    await clear_login_attempts(email)

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        token_type="bearer",
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        user_id = data["sub"]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Gecersiz veya suresi dolmus refresh token.",
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kullanici bulunamadi.")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        token_type="bearer",
        user=user,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id=Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi.")
    return user


@router.post("/check-password")
async def check_password(body: dict):
    """Frontend password strength checker — no auth required."""
    password = body.get("password", "")
    result = check_password_strength(password)
    return {
        "score": result.score,
        "label": result.label,
        "color": result.color,
        "issues": result.issues,
        "passed": result.passed,
    }
