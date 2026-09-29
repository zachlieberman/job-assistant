import base64
import hashlib
import hmac
import json
import os
import time
from collections import defaultdict

from fastapi import Header, HTTPException, Request

TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60  # 30 days
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 15 * 60

_failed_login_attempts: dict[str, list[float]] = defaultdict(list)


def _admin_username() -> str:
    username = os.environ.get("ADMIN_USERNAME")
    if not username:
        raise RuntimeError("ADMIN_USERNAME is not set — add it to backend/.env")
    return username


def _admin_password() -> str:
    password = os.environ.get("ADMIN_PASSWORD")
    if not password:
        raise RuntimeError("ADMIN_PASSWORD is not set — add it to backend/.env")
    return password


def _signing_key() -> bytes:
    # Falls back to ADMIN_PASSWORD so existing deployments keep working without
    # a new required env var, but setting TOKEN_SIGNING_KEY lets the admin
    # password rotate without invalidating every issued token, and vice versa.
    key = os.environ.get("TOKEN_SIGNING_KEY") or _admin_password()
    return key.encode()


def check_login_rate_limit(client_key: str) -> None:
    now = time.time()
    attempts = [t for t in _failed_login_attempts[client_key] if now - t < LOGIN_LOCKOUT_SECONDS]
    _failed_login_attempts[client_key] = attempts
    if len(attempts) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many login attempts — try again later")


def record_failed_login(client_key: str) -> None:
    _failed_login_attempts[client_key].append(time.time())


def clear_failed_logins(client_key: str) -> None:
    _failed_login_attempts.pop(client_key, None)


def login_client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def verify_credentials(username: str, password: str) -> bool:
    return hmac.compare_digest(username, _admin_username()) and hmac.compare_digest(
        password, _admin_password()
    )


def create_token() -> str:
    payload = json.dumps({"exp": int(time.time()) + TOKEN_TTL_SECONDS}).encode()
    signature = hmac.new(_signing_key(), payload, hashlib.sha256).digest()
    return f"{_b64encode(payload)}.{_b64encode(signature)}"


def verify_token(token: str) -> bool:
    try:
        payload_b64, signature_b64 = token.split(".", 1)
        payload = _b64decode(payload_b64)
        signature = _b64decode(signature_b64)
    except ValueError:
        return False

    expected_signature = hmac.new(_signing_key(), payload, hashlib.sha256).digest()
    if not hmac.compare_digest(expected_signature, signature):
        return False

    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return False

    return data.get("exp", 0) > time.time()


async def require_auth(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ").strip()
    if not verify_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
