from __future__ import annotations

import os
import logging
from typing import Optional, Any, Dict

import httpx
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Cookie,
    status,
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.user import UserOut

router = APIRouter()
# akzeptiert fehlenden Authorization-Header ohne sofortigen 403
bearer = HTTPBearer(auto_error=False)

# ───────────────────────────────────────────────────────────────
# Config
# ───────────────────────────────────────────────────────────────
AUTH_BASE_URL = os.getenv("AUTH_BASE_URL", "http://authentification-backend:8101").rstrip("/")
AUTH_INTROSPECT_URL = os.getenv("AUTH_INTROSPECT_URL") or f"{AUTH_BASE_URL}/introspect"
AUTH_HTTP_TIMEOUT = float(os.getenv("AUTH_HTTP_TIMEOUT", "5.0"))
AUTH_CLIENT_ID = os.getenv("AUTH_CLIENT_ID")
AUTH_CLIENT_SECRET = os.getenv("AUTH_CLIENT_SECRET")

logger = logging.getLogger("auth_gateway")
logger.info("Using AUTH_BASE_URL=%s", AUTH_BASE_URL)
logger.info("Using AUTH_INTROSPECT_URL=%s", AUTH_INTROSPECT_URL)

# ───────────────────────────────────────────────────────────────
# HTTP helpers
# ───────────────────────────────────────────────────────────────
async def _http_get(url: str, headers: Optional[Dict[str, str]] = None) -> httpx.Response:
    async with httpx.AsyncClient(timeout=AUTH_HTTP_TIMEOUT) as client:
        return await client.get(url, headers=headers)

async def _http_post(
        url: str,
        data: Dict[str, Any],
        auth: Optional[tuple[str, str]] = None,
) -> httpx.Response:
    async with httpx.AsyncClient(timeout=AUTH_HTTP_TIMEOUT) as client:
        # introspection erwartet i. d. R. form-encoded
        return await client.post(url, data=data, auth=auth)

# ───────────────────────────────────────────────────────────────
# Introspection
# ───────────────────────────────────────────────────────────────
async def introspect_token(token: str) -> dict:
    """
    Ruft das Auth-Backend /introspect auf.
    Rückgabe: dict mit mind. {"active": bool}. Wirft HTTPException bei Fehlern.
    """
    basic_auth = (AUTH_CLIENT_ID, AUTH_CLIENT_SECRET) if (AUTH_CLIENT_ID and AUTH_CLIENT_SECRET) else None
    url = AUTH_INTROSPECT_URL
    logger.info("Calling auth /introspect at %s", url)
    try:
        r = await _http_post(url, data={"token": token}, auth=basic_auth)
        logger.debug("/introspect status=%s body=%s", r.status_code, r.text)
    except httpx.RequestError as e:
        logger.error("Auth service unreachable at %s: %s", url, e)
        raise HTTPException(status_code=503, detail=f"Auth service unavailable at {url}: {e}")

    if r.status_code != 200:
        logger.error("Auth /introspect failed at %s: status=%s body=%s", url, r.status_code, r.text)
        raise HTTPException(
            status_code=401,
            detail={
                "message": "Token introspection failed",
                "upstream_status": r.status_code,
                "upstream_body": r.text,
                "url": url,
            },
        )

    try:
        data = r.json()
    except ValueError:
        logger.error("Introspection returned invalid JSON from %s: %s", url, r.text)
        raise HTTPException(status_code=502, detail="Auth service returned invalid JSON")

    if not data.get("active"):
        return {"active": False}

    return data

# ───────────────────────────────────────────────────────────────
# Normalization
# ───────────────────────────────────────────────────────────────
def _normalize_user_payload(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    mappt das User-Dict vom Auth-Service auf unser UserOut Schema.
    """
    return {
        "id": user.get("id"),
        "username": user.get("username"),
        "email": user.get("email"),
        "first_name": user.get("first_name") or "",
        "last_name": user.get("last_name") or "",
        "is_verified": bool(user.get("is_verified")),
        "registered_at": user.get("registered_at"),
        "last_login_at": user.get("last_login_at"),
        "privilege": int(user.get("privilege") or 0),
    }

# ───────────────────────────────────────────────────────────────
# Token extraction
# ───────────────────────────────────────────────────────────────
def _extract_token(
        request: Request,
        creds: Optional[HTTPAuthorizationCredentials],
        cookie_token: Optional[str],
) -> Optional[str]:
    # 1) Authorization: Bearer <token>
    if creds and creds.scheme.lower() == "bearer" and creds.credentials:
        return creds.credentials
    # 2) Cookie (canonical)
    if cookie_token:
        return cookie_token
    # 3) Cookie fallback (alter, vertippter Name)
    legacy = request.cookies.get("access_token") or request.cookies.get("acces_toke")
    if legacy:
        return legacy
    return None

# ───────────────────────────────────────────────────────────────
# Dependency
# ───────────────────────────────────────────────────────────────
@router.get("/")
def health_check():
    return {"status": "ok"}

async def _load_user_from_auth(token: str) -> Dict[str, Any]:
    """
    Falls /introspect keinen vollständigen User liefert: /me aufrufen.
    """
    me_url = f"{AUTH_BASE_URL}/me"
    try:
        r = await _http_get(me_url, headers={"Authorization": f"Bearer {token}"})
        logger.debug("/me status=%s body=%s", r.status_code, r.text)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Auth service unavailable at {me_url}: {e}")

    if r.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail={
                "message": "Auth /me failed",
                "upstream_status": r.status_code,
                "upstream_body": r.text,
                "url": me_url,
            },
        )
    try:
        return r.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Auth service returned invalid JSON")

async def get_current_user(
        request: Request,
        creds: HTTPAuthorizationCredentials = Depends(bearer),
        access_token: Optional[str] = Cookie(default=None),
) -> UserOut:
    """
    Liefert den aktuellen User: akzeptiert Bearer-Header ODER Cookie `access_token`.
    """
    token = _extract_token(request, creds, access_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1) Introspect
    data = await introspect_token(token)
    if not data.get("active"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # 2) User aus Introspection oder /me
    user_dict = data.get("user") or await _load_user_from_auth(token)

    # 3) Normalisieren
    payload = _normalize_user_payload(user_dict)
    return UserOut(**payload)