from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    """
    Register a new user (inspector / manufacturer / admin) and receive
    a JWT access token immediately, matching the frontend's expected
    flow of register -> logged in.
    """
    return auth_service.register_user(payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """Authenticate with email + password and receive a JWT access token."""
    return auth_service.login_user(payload)


@router.get("/me", response_model=UserOut)
def get_me(token_payload: dict = Depends(get_current_user_payload)):
    """Convenience endpoint for the frontend to fetch the logged-in user."""
    user = auth_service.get_current_user(token_payload)
    return UserOut(id=user["id"], name=user["name"], email=user["email"], role=user["role"])
