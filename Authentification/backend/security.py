import os
import time
import base64
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

# ===== Settings =====
JWT_ALG = os.getenv("JWT_ALG", "HS256")  # HS256 (shared secret) or RS256 (RSA keys)
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", "60"))

# HS256 secret
JWT_SECRET = os.getenv("JWT_SECRET", "devsecret")

# RS256 keys (PEM strings). Only used if JWT_ALG == "RS256"
JWT_PRIVATE_KEY_PEM = os.getenv("JWT_PRIVATE_KEY_PEM")
JWT_PUBLIC_KEY_PEM = os.getenv("JWT_PUBLIC_KEY_PEM")

# Email verification token secret (HS256). Keep separate from access-token secret.
VERIF_SECRET = os.getenv("VERIF_SECRET", "verifysecret")

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ===== Password helpers =====
def hash_password(password: str) -> str:
    return pwd.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd.verify(password, hashed)

# ===== Internal helpers =====
def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def _get_signing_key_and_alg_for_access() -> tuple[str, str]:
    if JWT_ALG.upper() == "RS256":
        if not JWT_PRIVATE_KEY_PEM:
            raise RuntimeError("RS256 selected but JWT_PRIVATE_KEY_PEM is not set")
        return (JWT_PRIVATE_KEY_PEM, "RS256")
    # default HS256
    return (JWT_SECRET, "HS256")

def _get_verify_key_and_alg_for_access() -> tuple[str, str]:
    if JWT_ALG.upper() == "RS256":
        if not JWT_PUBLIC_KEY_PEM:
            raise RuntimeError("RS256 selected but JWT_PUBLIC_KEY_PEM is not set")
        return (JWT_PUBLIC_KEY_PEM, "RS256")
    return (JWT_SECRET, "HS256")

# ===== Access token (scope = access) =====
def create_access_token(subject: str, ver: int = 0, expires_in_seconds: int = 3600) -> str:
    now = int(time.time())
    payload = {
        "sub": subject,
        "iat": now,
        "exp": now + expires_in_seconds,
        "scope": "access",
        "ver": ver,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_access_token(token: str) -> Dict[str, Any]:
    key, alg = _get_verify_key_and_alg_for_access()
    data = jwt.decode(token, key, algorithms=[alg])
    if data.get("scope") != "access":
        raise JWTError("invalid scope")
    return data

# ===== Email verification token (scope = verify, HS256) =====
def create_verify_token(email: str) -> str:
    now = int(time.time())
    exp = now + int(os.getenv("VERIFY_EXPIRE_MIN", "60")) * 60
    payload = {"sub": email, "iat": now, "exp": exp, "scope": "verify"}
    # Always HS256 for verification tokens unless you also provide RS keys explicitly
    alg = "RS256" if JWT_ALG.upper() == "RS256" and JWT_PRIVATE_KEY_PEM else "HS256"
    key = JWT_PRIVATE_KEY_PEM if alg == "RS256" else VERIF_SECRET  # type: ignore[assignment]
    return jwt.encode(payload, key, algorithm=alg)

def decode_verify_token(token: str) -> Dict[str, Any]:
    alg = "RS256" if JWT_ALG.upper() == "RS256" and JWT_PUBLIC_KEY_PEM else "HS256"
    key = JWT_PUBLIC_KEY_PEM if alg == "RS256" else VERIF_SECRET  # type: ignore[assignment]
    data = jwt.decode(token, key, algorithms=[alg])
    if data.get("scope") != "verify":
        raise JWTError("invalid scope")
    return data

# ===== Public JWK for RS256 (used by /.well-known/jwks.json route in main.py) =====
def public_jwk() -> Dict[str, Any]:
    if JWT_ALG.upper() != "RS256":
        # HS256 doesn't have a public key JWK. Return metadata only.
        return {"kty": "oct", "alg": "HS256", "use": "sig"}
    if not JWT_PUBLIC_KEY_PEM:
        raise RuntimeError("JWT_PUBLIC_KEY_PEM must be set for RS256")
    public_key = serialization.load_pem_public_key(JWT_PUBLIC_KEY_PEM.encode("utf-8"))
    if not isinstance(public_key, rsa.RSAPublicKey):
        raise RuntimeError("JWT_PUBLIC_KEY_PEM is not an RSA public key")
    numbers = public_key.public_numbers()
    n = numbers.n.to_bytes((numbers.n.bit_length() + 7) // 8, byteorder="big")
    e = numbers.e.to_bytes((numbers.e.bit_length() + 7) // 8, byteorder="big")
    jwk = {
        "kty": "RSA",
        "alg": "RS256",
        "use": "sig",
        "n": _b64u(n),
        "e": _b64u(e),
    }
    return jwk