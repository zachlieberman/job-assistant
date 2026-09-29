import re

from app.main import _parse_cors_origins, _vercel_preview_origin_regex


def test_parses_single_origin():
    assert _parse_cors_origins("http://localhost:5173", "http://localhost:5173") == [
        "http://localhost:5173"
    ]


def test_parses_multiple_comma_separated_origins():
    raw = "https://a.vercel.app, https://b.vercel.app"
    assert _parse_cors_origins(raw, "http://localhost:5173") == [
        "https://a.vercel.app",
        "https://b.vercel.app",
    ]


def test_falls_back_to_default_when_empty():
    assert _parse_cors_origins("", "http://localhost:5173") == ["http://localhost:5173"]


def test_falls_back_to_default_when_only_commas():
    assert _parse_cors_origins(",, ,", "http://localhost:5173") == ["http://localhost:5173"]


def test_vercel_preview_regex_matches_own_team_previews():
    assert re.match(
        _vercel_preview_origin_regex, "https://job-assistant-n3p8lyfwr-zach-s-squad.vercel.app"
    )
    assert re.match(
        _vercel_preview_origin_regex, "https://job-assistant-phjki93a3-zach-s-squad.vercel.app"
    )


def test_vercel_preview_regex_rejects_other_teams_and_projects():
    # A different Vercel account could register a project literally named
    # "job-assistant-evil" — the regex must not match unless it's under our
    # own (globally unique) team slug.
    assert not re.match(_vercel_preview_origin_regex, "https://job-assistant-evil.vercel.app")
    assert not re.match(_vercel_preview_origin_regex, "https://evil.com")
    assert not re.match(
        _vercel_preview_origin_regex, "https://job-assistant-abc123-some-other-team.vercel.app"
    )


def test_vercel_preview_regex_does_not_match_production_alias():
    # The short production alias (no per-deploy hash/team suffix) isn't
    # covered by the regex — it must be listed explicitly in CORS_ORIGINS.
    assert not re.match(_vercel_preview_origin_regex, "https://job-assistant-sigma-two.vercel.app")
