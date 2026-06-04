"""
Redis-based rate limiting and account lockout.
- Login: max 5 attempts per email per 15 minutes
- Register: max 3 attempts per IP per hour
- Account lockout: 30 min after 10 failed attempts
"""
import redis.asyncio as aioredis
from fastapi import HTTPException, Request, status

REDIS_URL = None  # Set from settings on first use


def _get_redis():
    from app.core.config import settings
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)


# ── LOGIN RATE LIMIT ──────────────────────────────────────────────────────

MAX_LOGIN_ATTEMPTS = 5          # per email
LOGIN_WINDOW_SECONDS = 900      # 15 minutes
LOCKOUT_ATTEMPTS = 10           # hard lockout
LOCKOUT_SECONDS = 1800          # 30 minutes


async def check_login_rate_limit(email: str, ip: str) -> None:
    """Raise 429 if too many login attempts. Raise 423 if account locked out."""
    r = _get_redis()
    try:
        # Hard lockout check
        lockout_key = f"lockout:{email.lower()}"
        if await r.exists(lockout_key):
            ttl = await r.ttl(lockout_key)
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Hesap gecici olarak kilitlendi. {ttl // 60} dakika sonra tekrar deneyin.",
            )

        # Soft rate limit by email
        email_key = f"login_attempt:{email.lower()}"
        attempts = await r.incr(email_key)
        if attempts == 1:
            await r.expire(email_key, LOGIN_WINDOW_SECONDS)

        if attempts > LOCKOUT_ATTEMPTS:
            await r.set(lockout_key, "locked", ex=LOCKOUT_SECONDS)
            await r.delete(email_key)
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Cok fazla basarisiz deneme. Hesap 30 dakika kilitlendi.",
            )

        if attempts > MAX_LOGIN_ATTEMPTS:
            remaining = await r.ttl(email_key)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Cok fazla giris denemesi. {remaining // 60} dakika {remaining % 60} saniye sonra tekrar deneyin.",
                headers={"Retry-After": str(remaining)},
            )
    finally:
        await r.aclose()


async def clear_login_attempts(email: str) -> None:
    """Clear failed attempts after successful login."""
    r = _get_redis()
    try:
        await r.delete(f"login_attempt:{email.lower()}")
    finally:
        await r.aclose()


async def record_failed_login(email: str) -> None:
    """Increment failed attempt counter (called on wrong password)."""
    r = _get_redis()
    try:
        key = f"login_attempt:{email.lower()}"
        await r.incr(key)
        await r.expire(key, LOGIN_WINDOW_SECONDS)
    finally:
        await r.aclose()


# ── REGISTER RATE LIMIT ───────────────────────────────────────────────────

MAX_REGISTER_ATTEMPTS = 5
REGISTER_WINDOW_SECONDS = 3600  # 1 hour


async def check_register_rate_limit(request: Request) -> None:
    """Limit registrations per IP to 5 per hour."""
    ip = request.client.host if request.client else "unknown"
    r = _get_redis()
    try:
        key = f"register_attempt:{ip}"
        attempts = await r.incr(key)
        if attempts == 1:
            await r.expire(key, REGISTER_WINDOW_SECONDS)
        if attempts > MAX_REGISTER_ATTEMPTS:
            remaining = await r.ttl(key)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Cok fazla kayit denemesi. {remaining // 60} dakika sonra tekrar deneyin.",
            )
    finally:
        await r.aclose()
