from pydantic import BaseModel

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    is_verified: bool
    registered_at: str | None = None
    last_login_at: str | None = None
    privilege: int