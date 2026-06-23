"""Unit tests for app.services.claude internals."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services import claude as claude_service


# ---------------------------------------------------------------------------
# _call_claude — JSON parsing
# ---------------------------------------------------------------------------


def _make_response(text: str):
    msg = MagicMock()
    msg.content = [MagicMock(text=text)]
    return msg


@pytest.mark.asyncio
async def test_call_claude_plain_json():
    payload = {"key": "value"}
    mock_response = _make_response(json.dumps(payload))
    with patch.object(
        claude_service.client.messages, "create", new_callable=AsyncMock
    ) as mock_create:
        mock_create.return_value = mock_response
        result = await claude_service._call_claude("system", "user", 100)
    assert result == payload


@pytest.mark.asyncio
async def test_call_claude_strips_markdown_fences():
    payload = {"answer": 42}
    fenced = f"```json\n{json.dumps(payload)}\n```"
    mock_response = _make_response(fenced)
    with patch.object(
        claude_service.client.messages, "create", new_callable=AsyncMock
    ) as mock_create:
        mock_create.return_value = mock_response
        result = await claude_service._call_claude("system", "user", 100)
    assert result == payload


@pytest.mark.asyncio
async def test_call_claude_raises_on_invalid_json():
    mock_response = _make_response("this is not json")
    with patch.object(
        claude_service.client.messages, "create", new_callable=AsyncMock
    ) as mock_create:
        mock_create.return_value = mock_response
        with pytest.raises(ValueError, match="Claude returned invalid JSON"):
            await claude_service._call_claude("system", "user", 100)


# ---------------------------------------------------------------------------
# _parse_csv_date
# ---------------------------------------------------------------------------


from app.routes.applications import _parse_csv_date  # noqa: E402
from datetime import date  # noqa: E402


def test_parse_csv_date_iso():
    assert _parse_csv_date("2024-01-15") == date(2024, 1, 15)


def test_parse_csv_date_us_slash():
    assert _parse_csv_date("01/15/2024") == date(2024, 1, 15)


def test_parse_csv_date_us_dash():
    assert _parse_csv_date("01-15-2024") == date(2024, 1, 15)


def test_parse_csv_date_whitespace():
    assert _parse_csv_date("  2024-06-01  ") == date(2024, 6, 1)


def test_parse_csv_date_invalid_falls_back_to_today():
    result = _parse_csv_date("not-a-date")
    assert result == date.today()
