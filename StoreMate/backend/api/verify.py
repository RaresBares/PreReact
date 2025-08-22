# app/api/verify.py
import time, requests
import requests.exceptions
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk
from jose.utils import base64url_decode
from app.config import settings
import os

security = HTTPBearer(auto_error=False)
_cache = {"jwks": None, "exp": 0}

def _jwks() -> Dict[str, Any]:
    now = int(time.time())
    if _cache["jwks"] and _cache["exp"] > now:
        return _cache["jwks"]
    try:
        r = requests.get(settings.AUTH_JWKS_URL, timeout=5)
        r.raise_for_status()
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, requests.exceptions.HTTPError):
        fallback_url = os.getenv("AUTH_JWKS_FALLBACK")
        if fallback_url:
            try:
                r = requests.get(fallback_url, timeout=5)
                r.raise_for_status()
                _cache["jwks"] = r.json()
                _cache["exp"] = now + 3600
                return _cache["jwks"]
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, requests.exceptions.HTTPError):
                raise
        else:
            raise
    _cache["jwks"] = r.json()
    _cache["exp"] = now + 3600
    return _cache["jwks"]

def _key_for_kid(kid: str):
    for k in _jwks().get("keys", []):
        if k.get("kid") == kid:
            return jwk.construct(k)
    return None

def require_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401)
    token = credentials.credentials
    try:
        hdr = jwt.get_unverified_header(token)
        key = _key_for_kid(hdr.get("kid"))
        if not key:
            raise HTTPException(status_code=401)
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=401)
        signing_input = ".".join(parts[0:2]).encode()
        signature = base64url_decode(parts[2].encode())
        if not key.verify(signing_input, signature):
            raise HTTPException(status_code=401)

        claims = jwt.get_unverified_claims(token)
        if claims.get("iss") != settings.AUTH_ISSUER:
            raise HTTPException(status_code=401)
        aud = claims.get("aud")
        if (isinstance(aud, list) and settings.AUTH_AUDIENCE not in aud) or (isinstance(aud, str) and aud != settings.AUTH_AUDIENCE):
            raise HTTPException(status_code=401)
        if int(time.time()) >= int(claims.get("exp", 0)):
            raise HTTPException(status_code=401)
        return claims
    except Exception:
        raise HTTPException(status_code=401)