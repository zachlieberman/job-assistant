"""Integration tests for real auth behavior (login, tokens, 401 enforcement).

Uses the `unauthenticated_client` fixture, which does NOT override
require_auth — unlike the `client` fixture used by the rest of the suite,
which bypasses auth entirely to isolate business-logic tests.
"""

import hashlib
import hmac
import json
import time

import pytest

from app import auth as auth_module


@pytest.fixture(autouse=True)
def _reset_login_rate_limit():
    auth_module._failed_login_attempts.clear()
    yield
    auth_module._failed_login_attempts.clear()


@pytest.mark.asyncio
async def test_login_with_correct_credentials_returns_token(unauthenticated_client):
    resp = await unauthenticated_client.post(
        "/auth/login", json={"username": "test-admin", "password": "test-password"}
    )
    assert resp.status_code == 200
    assert "token" in resp.json()


@pytest.mark.asyncio
async def test_login_with_wrong_password_is_rejected(unauthenticated_client):
    resp = await unauthenticated_client.post(
        "/auth/login", json={"username": "test-admin", "password": "wrong"}
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_with_wrong_username_is_rejected(unauthenticated_client):
    resp = await unauthenticated_client.post(
        "/auth/login", json={"username": "someone-else", "password": "test-password"}
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_is_rate_limited_after_repeated_failures(unauthenticated_client):
    for _ in range(auth_module.MAX_LOGIN_ATTEMPTS):
        resp = await unauthenticated_client.post(
            "/auth/login", json={"username": "test-admin", "password": "wrong"}
        )
        assert resp.status_code == 401

    resp = await unauthenticated_client.post(
        "/auth/login", json={"username": "test-admin", "password": "wrong"}
    )
    assert resp.status_code == 429


@pytest.mark.asyncio
async def test_protected_route_rejects_missing_token(unauthenticated_client):
    resp = await unauthenticated_client.get("/applications")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_accepts_valid_token(unauthenticated_client):
    login = await unauthenticated_client.post(
        "/auth/login", json={"username": "test-admin", "password": "test-password"}
    )
    token = login.json()["token"]
    resp = await unauthenticated_client.get(
        "/applications", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_portfolio_bio_read_is_public(unauthenticated_client):
    resp = await unauthenticated_client.get("/portfolio/bio")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_portfolio_bio_update_rejects_missing_token(unauthenticated_client):
    resp = await unauthenticated_client.put("/portfolio/bio", json={"title": "Hacked"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_portfolio_bio_update_accepts_valid_token(unauthenticated_client):
    login = await unauthenticated_client.post(
        "/auth/login", json={"username": "test-admin", "password": "test-password"}
    )
    token = login.json()["token"]
    resp = await unauthenticated_client.put(
        "/portfolio/bio",
        json={"title": "Updated Title"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Title"


def test_verify_token_round_trips():
    token = auth_module.create_token()
    assert auth_module.verify_token(token) is True


def test_verify_token_rejects_malformed_token():
    assert auth_module.verify_token("not-a-real-token") is False


def test_verify_token_rejects_expired_token():
    payload = json.dumps({"exp": int(time.time()) - 10}).encode()
    signature = hmac.new(auth_module._signing_key(), payload, hashlib.sha256).digest()
    token = f"{auth_module._b64encode(payload)}.{auth_module._b64encode(signature)}"
    assert auth_module.verify_token(token) is False


def test_verify_token_rejects_tampered_signature():
    token = auth_module.create_token()
    payload_b64, _signature_b64 = token.split(".", 1)
    tampered = f"{payload_b64}.{auth_module._b64encode(b'not-the-real-signature!')}"
    assert auth_module.verify_token(tampered) is False
