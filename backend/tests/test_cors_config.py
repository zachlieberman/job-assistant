from app.main import _parse_cors_origins


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
