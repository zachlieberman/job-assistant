from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.auth import (
    check_login_rate_limit,
    clear_failed_logins,
    create_token,
    login_client_key,
    record_failed_login,
    verify_credentials,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, request: Request):
    client_key = login_client_key(request)
    check_login_rate_limit(client_key)
    if not verify_credentials(payload.username, payload.password):
        record_failed_login(client_key)
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    clear_failed_logins(client_key)
    return LoginResponse(token=create_token())
