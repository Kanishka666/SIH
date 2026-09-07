from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    inspector = "inspector"
    manufacturer = "manufacturer"
    admin = "admin"


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, examples=["Aditi Sharma"])
    email: EmailStr = Field(..., examples=["aditi@example.com"])
    password: str = Field(..., min_length=6, examples=["strongpassword123"])
    role: UserRole = Field(..., examples=["inspector"])


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["aditi@example.com"])
    password: str = Field(..., examples=["strongpassword123"])


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
