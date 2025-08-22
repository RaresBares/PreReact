from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.utils.auth import get_current_user

router = APIRouter()

@router.get("/profile", response_model=UserOut)
def profile(user: UserOut = Depends(get_current_user)) -> UserOut:
    """Get the current user's profile."""
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user_by_id(user_id: int,
                   current_user: UserOut = Depends(get_current_user),
                   db: Session = Depends(get_db)) -> UserOut:
    """Get a user's profile by ID with privilege checks."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    requester_username = getattr(current_user, "username", None)
    same_user = requester_username == getattr(user, "username", None)

    def _to_int_priv(v):
        try:
            return int(v)
        except Exception:
            try:
                return int(getattr(v, "value"))
            except Exception:
                return 0

    req_priv = _to_int_priv(getattr(current_user, "privilege", 0))
    tgt_priv = _to_int_priv(getattr(user, "privilege", 0))
    has_priv = req_priv >= tgt_priv

    if not (same_user or has_priv):
        raise HTTPException(status_code=403, detail="Insufficient privileges")

    try:
        return UserOut.from_orm(user)
    except Exception:
        return {
            "email": getattr(user, "email", None),
            "username": getattr(user, "username", None),
            "privilege": tgt_priv,
        }

@router.get("/test")
def read_me():
    return {"status": "ok"}