from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
import time

from database import Base, engine, get_db
from models import User
from security import (
    hash_password, verify_password, create_access_token, decode_access_token,
    create_verify_token, decode_verify_token
)
from emailer import send_verification, email_enabled

app = FastAPI(title="Auth Service")
Base.metadata.create_all(bind=engine)
auth_scheme = HTTPBearer()

def user_to_public_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_verified": user.is_verified,
        "registered_at": user.registered_at.isoformat() if user.registered_at else None,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "privilege": user.privilege,
    }


def _decode_and_load_user(token: str | None, request: Request, db: Session) -> tuple[dict | None, User | None]:
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        return None, None
    try:
        payload = decode_access_token(token)
    except Exception:
        return None, None
    username = payload.get("sub")
    if not username:
        return None, None
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None, None
    return payload, user


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/auth/debug")
async def auth_debug(request: Request):
    body = await request.json()
    return {"received": body, "headers": dict(request.headers), "time": time.time()}


@app.post("/register")
async def register(request: Request, db: Session = Depends(get_db)):
    ct = request.headers.get("content-type", "").lower()
    data: dict
    if "application/json" in ct:
        data = await request.json()
    else:
        form = await request.form()
        data = {k: (v if isinstance(v, str) else v.filename if hasattr(v, "filename") else str(v)) for k, v in form.items()}
    _username = (data.get("username") or "").strip()
    _email = (data.get("email") or "").lower().strip()
    _first = (data.get("first_name") or "").strip()
    _last = (data.get("last_name") or "").strip()
    _pw = (data.get("password") or "").strip()
    if not all([_username, _email, _first, _last, _pw]):
        raise HTTPException(status_code=422, detail="missing required fields")
    u = User(
        username=_username,
        email=_email,
        first_name=_first,
        last_name=_last,
        password_hash=hash_password(_pw),
        is_verified=not email_enabled(),
    )
    token = None
    if email_enabled():
        token = create_verify_token(u.email)
        u.verification_token = token
    try:
        db.add(u)
        db.commit()
        db.refresh(u)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="username or email exists")
    if email_enabled():
        send_verification(u.email, token)  # type: ignore[arg-type]
        return {"message": "registered, verify email"}
    else:
        return {"message": "registered", "email_verification": "disabled"}


@app.get("/verify")
def verify(token: str, db: Session = Depends(get_db)):
    if not email_enabled():
        return {"message": "email verification disabled"}
    try:
        data = decode_verify_token(token)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid token")
    email = data.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user or user.verification_token != token:
        raise HTTPException(status_code=400, detail="invalid token")
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "verified"}


@app.post("/login")
def login(payload: dict, db: Session = Depends(get_db)):
    ident = payload.get("username_or_email") or ""
    password = payload.get("password") or ""
    q = db.query(User)
    u = q.filter((User.username == ident) | (User.email == ident.lower())).first()
    if not u or not verify_password(password, u.password_hash):
        raise HTTPException(status_code=400, detail="invalid credentials")
    if not u.is_verified:
        raise HTTPException(status_code=403, detail="email not verified")
    u.last_login_at = datetime.now(timezone.utc)
    db.commit()
    ver = getattr(u, "token_version", 0) or 0
    token = create_access_token(u.username, ver=ver)
    return {"access_token": token}


def current_user(creds: HTTPAuthorizationCredentials = Depends(auth_scheme), db: Session = Depends(get_db)) -> User:
    try:
        data = decode_access_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    username = data.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    if data.get("ver") != getattr(user, "token_version", 0):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user



@app.post("/auth/introspect")
@app.post("/introspect")
async def introspect(request: Request, db: Session = Depends(get_db)):
    token = None

    ct = request.headers.get("content-type", "").lower()
    if "application/json" in ct:
        body = await request.json()
        token = body.get("token") if isinstance(body, dict) else None
    else:
        form = await request.form()
        token = form.get("token")

    payload, user = _decode_and_load_user(token, request, db)
    if not payload or not user:
        return JSONResponse(status_code=401, content={"active": False})
    if payload.get("ver") != getattr(user, "token_version", 0):
        return JSONResponse(status_code=401, content={"active": False})

    return JSONResponse(status_code=200, content={"active": True, "user": user_to_public_dict(user)})

@app.get("/me")
def me(user: User = Depends(current_user)):
    return user_to_public_dict(user)


@app.get("/me/registration_date")
def reg_date(user: User = Depends(current_user)):
    return {"registered_at": user.registered_at.isoformat()}


@app.get("/me/last_login")
def last_login(user: User = Depends(current_user)):
    return {"last_login_at": user.last_login_at.isoformat() if user.last_login_at else None}


@app.get("/auth/allow")
@app.head("/auth/allow")
def auth_allow(request: Request, db: Session = Depends(get_db)):
    payload, user = _decode_and_load_user(None, request, db)
    if not payload or not user:
        raise HTTPException(status_code=401, detail="unauthorized")
    if payload.get("ver") != getattr(user, "token_version", 0):
        raise HTTPException(status_code=401, detail="unauthorized")
    return Response(status_code=204)

@app.post("/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    raw = request.cookies.get("access_token") or (request.headers.get("authorization") or "")
    token = None
    if raw:
        token = raw.replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=400, detail="token required")
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token")
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="invalid user")
    user.token_version = (getattr(user, "token_version", 0) or 0) + 1
    db.commit()
    resp = JSONResponse({"success": True})
    resp.delete_cookie("access_token", path="/")
    return resp