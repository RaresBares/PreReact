from app.schemas.user import UserOut
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import httpx
import os
import logging
from datetime import datetime, timedelta

auth_scheme = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("SECRET_KEY", "defaultsecret")
ALGORITHM = "HS256"
AUTH_BASE_URL = os.getenv("AUTH_BASE_URL", "http://auth_backend:8081")

logger = logging.getLogger(__name__)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(auth_scheme)) -> UserOut:
  if not creds or not creds.credentials:
    raise HTTPException(status_code=401, detail="Missing token", headers={"WWW-Authenticate": "Bearer"})
  token = creds.credentials
  try:
    async with httpx.AsyncClient(timeout=5.0) as client:
      r = await client.get(f"{AUTH_BASE_URL}/me", headers={"Authorization": f"Bearer {token}"})
      logger.debug("/me response status=%s body=%s", r.status_code, r.text)
  except httpx.RequestError as e:
    logger.error("Auth service unreachable: %s", str(e))
    raise HTTPException(status_code=503, detail=f"Auth service unavailable: {e}")
  if r.status_code != 200:
    logger.error("Auth /me failed: status=%s body=%s", r.status_code, r.text)
    raise HTTPException(status_code=401, detail={
      "message": "Auth /me failed",
      "upstream_status": r.status_code,
      "upstream_body": r.text
    }, headers={"WWW-Authenticate": "Bearer"})
  data = r.json()
  return UserOut(**data)
