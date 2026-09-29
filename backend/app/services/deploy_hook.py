"""Rebuilds the public site after portfolio content edits.

The public portfolio is prerendered at build time from this API, so crawlers only
see edits after a redeploy. Saving content calls `schedule_rebuild()`, which POSTs
to a Vercel Deploy Hook once edits have stopped for a short quiet period, so a
burst of edits triggers one build. Everything here is best effort: a missing or
failing hook is logged and never affects the request that triggered it.
"""

import asyncio
import logging
import os
import urllib.request
from typing import AsyncIterator, Optional

logger = logging.getLogger(__name__)

_DEFAULT_DEBOUNCE_SECONDS = 60.0
_REQUEST_TIMEOUT_SECONDS = 15

# In-process state: a pending rebuild is lost if the service restarts before it
# fires. Acceptable for a portfolio; redeploy manually in that rare case.
_pending: Optional["asyncio.Task[None]"] = None


def _hook_url() -> Optional[str]:
    url = os.getenv("VERCEL_DEPLOY_HOOK_URL", "").strip()
    if not url:
        return None
    if not url.startswith("https://"):
        logger.warning("Ignoring VERCEL_DEPLOY_HOOK_URL: it must be an https:// URL")
        return None
    return url


def _debounce_seconds() -> float:
    raw = os.getenv("REBUILD_DEBOUNCE_SECONDS", "")
    try:
        return max(0.0, float(raw)) if raw else _DEFAULT_DEBOUNCE_SECONDS
    except ValueError:
        logger.warning("Invalid REBUILD_DEBOUNCE_SECONDS %r; using %ss", raw, _DEFAULT_DEBOUNCE_SECONDS)
        return _DEFAULT_DEBOUNCE_SECONDS


def _post(url: str) -> int:
    request = urllib.request.Request(url, method="POST", data=b"")
    with urllib.request.urlopen(request, timeout=_REQUEST_TIMEOUT_SECONDS) as response:
        return response.status


async def _fire(url: str, delay: float) -> None:
    global _pending
    try:
        await asyncio.sleep(delay)
        status = await asyncio.to_thread(_post, url)
        logger.info("Triggered public site rebuild (HTTP %s)", status)
    except asyncio.CancelledError:
        raise  # superseded by a newer edit
    except Exception:
        # The hook URL is a secret, so log the error type only, never the request.
        logger.exception("Could not trigger public site rebuild")
    finally:
        if _pending is asyncio.current_task():
            _pending = None


def schedule_rebuild() -> None:
    """Request a rebuild after the debounce period. No-op when no hook is configured."""
    global _pending
    url = _hook_url()
    if url is None:
        return
    if _pending is not None:
        _pending.cancel()
    _pending = asyncio.get_running_loop().create_task(_fire(url, _debounce_seconds()))


async def rebuild_on_success() -> AsyncIterator[None]:
    """Route dependency: schedules a rebuild only if the handler finished without raising."""
    yield
    schedule_rebuild()
