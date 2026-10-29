from pydantic import BaseModel, field_validator
import re


class RegisterRequest(BaseModel):
    login_id: str | None = None
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("login_id")
    @classmethod
    def validate_login_id(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not re.match(r'^[a-zA-Z0-9_\-\.]{3,64}$', v):
            raise ValueError("Login ID must be 3-64 chars, alphanumeric, dashes, underscores, or dots")
        return v


class LoginRequest(BaseModel):
    login_id: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    pass


class LogoutRequest(BaseModel):
    pass
