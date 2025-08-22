from pydantic import BaseModel, EmailStr, Field

class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=128)
    last_name: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=8, max_length=128)

class LoginIn(BaseModel):
    username_or_email: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProfileOut(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    is_verified: bool
    registered_at: str
    last_login_at: str | None