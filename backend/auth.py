"""
Auth with self-contained JWT tokens.
The full farmer profile is embedded in the JWT so auth works across
isolated Vercel serverless functions without shared database state.
"""

import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import User
from models.schemas import (
    RegisterRequest, LoginRequest, TokenResponse,
    UserProfile, ProfileUpdate,
)

SECRET_KEY = os.getenv("JWT_SECRET", "agriagent-devfest-chennai-2026")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _hash(password: str) -> str:
    return pwd_context.hash(password)


def _verify(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(user) -> str:
    """Embed the full profile in the JWT so no DB lookup is needed later."""
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user.id),
        "exp": expire,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "district": user.district,
        "soil_type": user.soil_type,
        "acreage": float(user.acreage),
        "primary_crop": user.primary_crop,
        "preferred_language": user.preferred_language or "English",
        "pwd_hash": user.hashed_password,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _user_from_jwt(payload: dict) -> User | None:
    """Reconstruct a User object from JWT claims (no DB needed)."""
    if not payload.get("full_name"):
        return None
    return User(
        id=int(payload.get("sub", 0)),
        full_name=payload["full_name"],
        phone_number=payload.get("phone_number", ""),
        hashed_password=payload.get("pwd_hash", ""),
        district=payload.get("district", ""),
        soil_type=payload.get("soil_type", ""),
        acreage=float(payload.get("acreage", 0)),
        primary_crop=payload.get("primary_crop", ""),
        preferred_language=payload.get("preferred_language", "English"),
    )


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub", 0))
    except (JWTError, ValueError):
        return None

    # Try DB first (works locally), fall back to JWT claims (works on Vercel)
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user
    return _user_from_jwt(payload)


def require_user(user: User | None = Depends(get_current_user)) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# --- Endpoints ---

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone_number == req.phone_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user = User(
        full_name=req.full_name,
        phone_number=req.phone_number,
        hashed_password=_hash(req.password),
        district=req.district,
        soil_type=req.soil_type,
        acreage=req.acreage,
        primary_crop=req.primary_crop,
        preferred_language=req.preferred_language,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=_create_token(user),
        user=UserProfile.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Try DB login first (works locally)
    user = db.query(User).filter(User.phone_number == req.phone_number).first()
    if user and _verify(req.password, user.hashed_password):
        return TokenResponse(
            access_token=_create_token(user),
            user=UserProfile.model_validate(user),
        )

    # On Vercel, DB may be empty. Check if they have a valid token in the request
    # (handled by frontend — re-register flow)
    raise HTTPException(status_code=401, detail="Invalid credentials. On cloud demo, please register again.")


@router.get("/me", response_model=UserProfile)
def get_me(user: User = Depends(require_user)):
    return UserProfile.model_validate(user)


@router.put("/profile", response_model=UserProfile)
def update_profile(
    updates: ProfileUpdate,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    try:
        db.commit()
        db.refresh(user)
    except Exception:
        pass
    return UserProfile.model_validate(user)
