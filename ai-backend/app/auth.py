import logging
from dataclasses import dataclass

import jwt  # PyJWT
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import BACKEND_JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE

logger = logging.getLogger(__name__)
_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: int
    email: str
    name: str
    role: str = "user"


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status_code=401, detail=detail, headers={"WWW-Authenticate": "Bearer"})


def verify_token(token: str) -> CurrentUser:
    """
    توکن HS256 که Next.js بعد از لاگین NextAuth امضا کرده را تایید می‌کند:
    امضا، انقضا (exp)، issuer و audience. هیچ تماس شبکه‌ای ندارد.
    """
    try:
        claims = jwt.decode(
            token,
            BACKEND_JWT_SECRET,
            algorithms=["HS256"],          # صریح: جلوی حمله‌ی alg=none / تعویض الگوریتم
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
            leeway=10,                      # اختلاف ساعت کوچک بین دو سرور
            options={"require": ["exp", "sub", "iss", "aud"]},
        )
    except jwt.ExpiredSignatureError:
        raise _unauthorized("token_expired")
    except jwt.InvalidTokenError:
        raise _unauthorized("invalid_token")

    try:
        user_id = int(claims["sub"])
    except (TypeError, ValueError):
        raise _unauthorized("invalid_token")
    if user_id <= 0:
        raise _unauthorized("invalid_token")

    email = str(claims.get("email") or "")
    return CurrentUser(
        id=user_id,
        email=email,
        name=str(claims.get("name") or email or f"user-{user_id}"),
        role=str(claims.get("role") or "user"),
    )


async def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> CurrentUser:
    if creds is None or not creds.credentials:
        raise _unauthorized("missing_token")
    return verify_token(creds.credentials)
