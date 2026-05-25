from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


GRID_SIZE = 28
CANVAS_SIZE = 128
FONT_SIZE = 96
ALPHA_THRESHOLD = 48


def extract_js_string_constant(source: str, name: str) -> str:
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*([\s\S]*?);", source)
    if not match:
        raise SystemExit(f"Cannot find JS constant {name}")

    expression = match.group(1).strip()
    if not expression.startswith('"') or not expression.endswith('"'):
        raise SystemExit(f"JS constant {name} must be a double-quoted string")

    return json.loads(expression)


def load_candidates(content_js: Path) -> list[str]:
    source = content_js.read_text(encoding="utf-8")
    text = (
        extract_js_string_constant(source, "DOMAIN_RECOGNITION_CANDIDATES")
        + extract_js_string_constant(source, "RECOGNITION_CANDIDATES")
    )
    seen: set[str] = set()
    candidates: list[str] = []
    for char in text:
        codepoint = ord(char)
        if 0x4E00 <= codepoint <= 0x9FFF and char not in seen:
            seen.add(char)
            candidates.append(char)
    return candidates


def bitset_to_hex(bits: list[int]) -> str:
    value = 0
    output: list[str] = []
    for index, bit in enumerate(bits, 1):
        value = (value << 1) | bit
        if index % 4 == 0:
            output.append(format(value, "x"))
            value = 0
    if len(bits) % 4:
        value <<= 4 - (len(bits) % 4)
        output.append(format(value, "x"))
    return "".join(output)


def fingerprint_char(font: ImageFont.FreeTypeFont, char: str) -> dict[str, object] | None:
    image = Image.new("L", (CANVAS_SIZE, CANVAS_SIZE), 0)
    draw = ImageDraw.Draw(image)
    bbox = draw.textbbox((0, 0), char, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    if width <= 0 or height <= 0:
        return None

    x = (CANVAS_SIZE - width) / 2 - bbox[0]
    y = (CANVAS_SIZE - height) / 2 - bbox[1] + 4
    draw.text((x, y), char, fill=255, font=font)

    pixels = image.load()
    min_x = CANVAS_SIZE
    min_y = CANVAS_SIZE
    max_x = -1
    max_y = -1
    for py in range(CANVAS_SIZE):
        for px in range(CANVAS_SIZE):
            if pixels[px, py] > ALPHA_THRESHOLD:
                min_x = min(min_x, px)
                min_y = min(min_y, py)
                max_x = max(max_x, px)
                max_y = max(max_y, py)

    if max_x < min_x or max_y < min_y:
        return None

    glyph_w = max_x - min_x + 1
    glyph_h = max_y - min_y + 1
    bits: list[int] = []
    projection_x = [0 for _ in range(GRID_SIZE)]
    projection_y = [0 for _ in range(GRID_SIZE)]
    ink = 0

    for gy in range(GRID_SIZE):
        for gx in range(GRID_SIZE):
            sample_x = min(CANVAS_SIZE - 1, max(0, round(min_x + ((gx + 0.5) / GRID_SIZE) * glyph_w)))
            sample_y = min(CANVAS_SIZE - 1, max(0, round(min_y + ((gy + 0.5) / GRID_SIZE) * glyph_h)))
            bit = 1 if pixels[sample_x, sample_y] > ALPHA_THRESHOLD else 0
            bits.append(bit)
            projection_x[gx] += bit
            projection_y[gy] += bit
            ink += bit

    return {
        "char": char,
        "codePoint": f"U+{ord(char):04X}",
        "aspect": round(glyph_w / max(1, glyph_h), 4),
        "ink": ink,
        "grid": bitset_to_hex(bits),
        "projectionX": projection_x,
        "projectionY": projection_y,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--content-js", type=Path, default=Path("extension/content/content.js"))
    parser.add_argument("--font", type=Path, default=Path(r"C:\Windows\Fonts\NotoSansSC-VF.ttf"))
    parser.add_argument("--out", type=Path, default=Path("extension/data/glyph-fingerprints-noto-sans-sc.json"))
    args = parser.parse_args()

    candidates = load_candidates(args.content_js)
    font = ImageFont.truetype(str(args.font), FONT_SIZE)
    entries = []

    for char in candidates:
        fingerprint = fingerprint_char(font, char)
        if fingerprint:
            entries.append(fingerprint)

    payload = {
        "version": 1,
        "font": args.font.name,
        "gridSize": GRID_SIZE,
        "candidateCount": len(entries),
        "entries": entries,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {args.out} with {len(entries)} fingerprints")


if __name__ == "__main__":
    main()
