import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import Header, HTTPException

TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60  # 30 days


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
    signature = hmac.new(_admin_password().encode(), payload, hashlib.sha256).digest()
    return f"{_b64encode(payload)}.{_b64encode(signature)}"


def verify_token(token: str) -> bool:
    try:
        payload_b64, signature_b64 = token.split(".", 1)
        payload = _b64decode(payload_b64)
        signature = _b64decode(signature_b64)
    except ValueError:
        return False

    expected_signature = hmac.new(_admin_password().encode(), payload, hashlib.sha256).digest()
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
