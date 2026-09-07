"""
Auth business logic. Routes call into this module; this module calls
into app.storage.memory_store. Swapping the store for a real DB later
should not require changes here beyond the storage import.
"""
from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.storage import memory_store


def register_user(payload: RegisterRequest) -> TokenResponse:
    existing = memory_store.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed = hash_password(payload.password)
    user = memory_store.create_user(
        name=payload.name,
        email=payload.email,
        hashed_password=hashed,
        role=payload.role.value,
    )
    return _issue_token(user)


def login_user(payload: LoginRequest) -> TokenResponse:
    user = memory_store.get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return _issue_token(user)


def get_current_user(payload: dict) -> dict:
    user_id = payload.get("sub")
    user = memory_store.get_user_by_id(user_id) if user_id else None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or token invalid",
        )
    return user


def _issue_token(user: dict) -> TokenResponse:
    token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut(id=user["id"], name=user["name"], email=user["email"], role=user["role"]),
    )
