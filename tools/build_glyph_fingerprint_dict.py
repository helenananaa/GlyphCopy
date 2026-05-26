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

FONT_CANDIDATES = [
    Path(r"C:\Windows\Fonts\NotoSansSC-VF.ttf"),
    Path(r"C:\Windows\Fonts\msyh.ttc"),
    Path(r"C:\Windows\Fonts\simsun.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path("/System/Library/Fonts/PingFang.ttc"),
    Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
    Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
]


def extract_js_string_constant(source: str, name: str) -> str:
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*([\s\S]*?);", source)
    if not match:
        raise SystemExit(f"Cannot find JS constant {name}")

    return parse_js_string_expression(match.group(1).strip(), name)


def parse_js_string_expression(expression: str, name: str) -> str:
    parts: list[str] = []
    index = 0
    while index < len(expression):
        index = skip_js_whitespace(expression, index)
        if index >= len(expression):
            break

        if expression[index] not in "\"'`":
            raise SystemExit(f"JS constant {name} must be a string literal or concatenated string literals")

        value, index = parse_js_string_literal(expression, index, name)
        parts.append(value)
        index = skip_js_whitespace(expression, index)
        if index >= len(expression):
            break
        if expression[index] != "+":
            raise SystemExit(f"JS constant {name} contains unsupported expression syntax")
        index += 1

    if not parts:
        raise SystemExit(f"JS constant {name} is empty")

    return "".join(parts)


def skip_js_whitespace(expression: str, index: int) -> int:
    while index < len(expression) and expression[index].isspace():
        index += 1
    return index


def parse_js_string_literal(expression: str, start: int, name: str) -> tuple[str, int]:
    quote = expression[start]
    index = start + 1
    chars: list[str] = []
    while index < len(expression):
        char = expression[index]
        if char == quote:
            return "".join(chars), index + 1
        if quote == "`" and char == "$" and index + 1 < len(expression) and expression[index + 1] == "{":
            raise SystemExit(f"JS constant {name} template string must not contain interpolation")
        if char != "\\":
            chars.append(char)
            index += 1
            continue

        decoded, index = decode_js_escape(expression, index)
        if decoded is not None:
            chars.append(decoded)

    raise SystemExit(f"JS constant {name} has an unterminated string literal")


def decode_js_escape(expression: str, slash_index: int) -> tuple[str | None, int]:
    index = slash_index + 1
    if index >= len(expression):
        return "\\", index

    char = expression[index]
    simple_escapes = {
        "b": "\b",
        "f": "\f",
        "n": "\n",
        "r": "\r",
        "t": "\t",
        "v": "\v",
        "0": "\0",
    }
    if char in simple_escapes:
        return simple_escapes[char], index + 1
    if char in "\r\n":
        if char == "\r" and index + 1 < len(expression) and expression[index + 1] == "\n":
            return None, index + 2
        return None, index + 1
    if char == "x" and index + 2 < len(expression):
        return chr(int(expression[index + 1 : index + 3], 16)), index + 3
    if char == "u":
        if index + 1 < len(expression) and expression[index + 1] == "{":
            end = expression.find("}", index + 2)
            if end < 0:
                raise SystemExit("Unterminated JS unicode escape")
            return chr(int(expression[index + 2 : end], 16)), end + 1
        if index + 4 < len(expression):
            return chr(int(expression[index + 1 : index + 5], 16)), index + 5

    return char, index + 1


def resolve_font_path(requested: Path | None) -> Path:
    if requested:
        if requested.exists():
            return requested
        raise SystemExit(f"Font not found: {requested}")

    for candidate in FONT_CANDIDATES:
        if candidate.exists():
            return candidate

    candidates = ", ".join(str(path) for path in FONT_CANDIDATES)
    raise SystemExit(f"No default Chinese font found. Pass --font explicitly. Checked: {candidates}")


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
    parser.add_argument("--font", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=Path("extension/data/glyph-fingerprints-noto-sans-sc.json"))
    args = parser.parse_args()

    candidates = load_candidates(args.content_js)
    font_path = resolve_font_path(args.font)
    font = ImageFont.truetype(str(font_path), FONT_SIZE)
    entries = []

    for char in candidates:
        fingerprint = fingerprint_char(font, char)
        if fingerprint:
            entries.append(fingerprint)

    payload = {
        "version": 1,
        "font": font_path.name,
        "gridSize": GRID_SIZE,
        "candidateCount": len(entries),
        "entries": entries,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {args.out} with {len(entries)} fingerprints")


if __name__ == "__main__":
    main()
