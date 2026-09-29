"""Render the 1200x630 Open Graph image to apps/public/public/og-image.png.

Uses the site's own type (Familjen Grotesk, from @fontsource) and monochrome
palette. Run from frontend/ after `npm ci`:

    pip install pillow fonttools
    python3 scripts/generate-og-image.py
"""
import io
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "node_modules/@fontsource/familjen-grotesk/files"
OUT = ROOT / "apps/public/public/og-image.png"

PAPER, INK, BODY, MIST = "#FAFAF8", "#0A0C10", "#5A5F68", "#8E929A"
WIDTH, HEIGHT, S = 1200, 630, 2  # draw at 2x, downsample for clean edges


def load_font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    font = TTFont(FONT_DIR / f"familjen-grotesk-latin-{weight}-normal.woff")
    font.flavor = None
    buffer = io.BytesIO()
    font.save(buffer)
    buffer.seek(0)
    return ImageFont.truetype(buffer, size * S)


def draw_mark(draw: ImageDraw.ImageDraw, left: int, top: int, size: int) -> None:
    """Brand mark, matching favicon.svg (64-unit grid)."""
    unit = size / 64
    draw.rounded_rectangle(
        [left * S, top * S, (left + size) * S, (top + size) * S], radius=18 * unit * S, fill=INK
    )
    path = [(18, 20), (46, 20), (20, 44), (46, 44)]
    pts = [((left + x * unit) * S, (top + y * unit) * S) for x, y in path]
    width = int(6 * unit * S)
    draw.line(pts, fill=PAPER, width=width, joint="curve")
    r = width / 2
    for x, y in pts:  # round caps and joins
        draw.ellipse([x - r, y - r, x + r, y + r], fill=PAPER)


def main() -> None:
    img = Image.new("RGB", (WIDTH * S, HEIGHT * S), PAPER)
    draw = ImageDraw.Draw(img)

    draw_mark(draw, 80, 72, 96)
    draw.text((208 * S, 94 * S), "Zachary Lieberman", font=load_font("700", 44), fill=INK)

    headline = load_font("700", 96)
    draw.text((80 * S, 256 * S), "I build careful software", font=headline, fill=INK)
    draw.text((80 * S, 364 * S),"for real problems.", font=headline, fill=MIST)

    small = load_font("400", 34)
    draw.text((80 * S, 540 * S), "Software Engineer  /  Los Angeles, CA", font=small, fill=BODY)
    site = "zachlieberman.dev"
    draw.text(((WIDTH - 80) * S - draw.textlength(site, font=small), 540 * S), site,
              font=small, fill=INK)

    out = img.resize((WIDTH, HEIGHT), Image.LANCZOS).quantize(colors=32)
    out.save(OUT, optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
