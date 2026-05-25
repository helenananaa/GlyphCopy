from __future__ import annotations

import argparse
import base64
import json
import math
import re
from pathlib import Path

from bs4 import BeautifulSoup
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont


CXSECRET_RE = re.compile(
    r"font-family:'font-cxsecret';src:url\('data:application/font-ttf;charset=utf-8;base64,([^']+)'\)"
)

# Confirmed from the glyph sheet in mooc1.chaoxing.com1.har.
# Kept as codepoints so this source file stays ASCII and survives Windows shells.
CONFIRMED_MAPPING = {
    0x6224: 0x8FDB,  # jin
    0x6225: 0x4FE1,  # xin
    0x6226: 0x9700,  # xu
    0x6228: 0x51FA,  # chu
    0x6229: 0x4E48,  # me
    0x622A: 0x90A3,  # na
    0x622B: 0x8F93,  # shu
    0x622D: 0x5165,  # ru
    0x622E: 0x4F7F,  # shi
    0x622F: 0x89E6,  # chu
    0x6230: 0x53D1,  # fa
    0x6231: 0x5BF9,  # dui
    0x6235: 0x8D1F,  # fu
    0x6239: 0x80FD,  # neng
    0x623A: 0x79CD,  # zhong
    0x623B: 0x6CBF,  # yan
    0x623C: 0x8FB9,  # bian
    0x623D: 0x6709,  # you
    0x6242: 0x529F,  # gong
    0x6243: 0x8BD1,  # yi
    0x6244: 0x7684,  # de
    0x6245: 0x4E2A,  # ge
    0x6246: 0x5C11,  # shao
    0x6248: 0x53F7,  # hao
    0x624A: 0x7801,  # ma
    0x624F: 0x6001,  # tai
    0x6250: 0x6CE2,  # bo
    0x6255: 0x8BBE,  # she
    0x6256: 0x793A,  # shi
    0x703B: 0x5668,  # qi
    0x7D25: 0x6240,  # suo
    0x820E: 0x56FE,  # tu
    0x9852: 0x7AEF,  # duan
}


def load_har_text(path: Path) -> list[tuple[str, str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    result: list[tuple[str, str]] = []
    for entry in data["log"]["entries"]:
        text = entry.get("response", {}).get("content", {}).get("text") or ""
        if text:
            result.append((entry.get("request", {}).get("url", ""), text))
    return result


def extract_font(entries: list[tuple[str, str]]) -> bytes:
    for _url, text in entries:
        match = CXSECRET_RE.search(text)
        if match:
            return base64.b64decode(match.group(1))
    raise SystemExit("No inline font-cxsecret data URI found.")


def render_glyph_sheet(font_path: Path, output_path: Path) -> None:
    font = TTFont(str(font_path))
    cmap = next(table.cmap for table in font["cmap"].tables if table.isUnicode())
    codes = sorted(cmap)

    glyph_font = ImageFont.truetype(str(font_path), 72)
    label_font = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 14)
    cell_w, cell_h, cols = 150, 130, 5
    rows = math.ceil(len(codes) / cols)
    image = Image.new("RGB", (cols * cell_w, rows * cell_h), "white")
    draw = ImageDraw.Draw(image)

    for index, codepoint in enumerate(codes):
        x = (index % cols) * cell_w
        y = (index // cols) * cell_h
        char = chr(codepoint)
        draw.rectangle([x, y, x + cell_w - 1, y + cell_h - 1], outline=(220, 220, 220))
        bbox = draw.textbbox((0, 0), char, font=glyph_font)
        width = bbox[2] - bbox[0]
        draw.text((x + (cell_w - width) / 2 - bbox[0], y + 8 - bbox[1]), char, font=glyph_font, fill="black")
        draw.text((x + 8, y + 92), f"U+{codepoint:04X} {char}", font=label_font, fill=(80, 80, 80))

    image.save(output_path)


def decode_text(text: str, mapping: dict[int, int]) -> str:
    return text.translate(mapping)


def write_decoded_blocks(entries: list[tuple[str, str]], output_path: Path) -> None:
    lines: list[str] = []
    for url, html in entries:
        if "font-cxsecret" not in html:
            continue
        soup = BeautifulSoup(html, "html.parser")
        for index, element in enumerate(soup.select(".font-cxsecret"), 1):
            raw = " ".join(element.get_text(" ", strip=True).split())
            decoded = decode_text(raw, CONFIRMED_MAPPING)
            if raw and raw != decoded:
                lines.extend([f"--- {url} block {index}", f"RAW: {raw}", f"DEC: {decoded}", ""])
    output_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("har", type=Path)
    parser.add_argument("--out", type=Path, default=Path("artifacts"))
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    entries = load_har_text(args.har)
    font_path = args.out / "cxsecret.ttf"
    font_path.write_bytes(extract_font(entries))

    render_glyph_sheet(font_path, args.out / "cxsecret_glyphs.png")
    (args.out / "cxsecret_mapping.json").write_text(
        json.dumps({chr(src): chr(dst) for src, dst in CONFIRMED_MAPPING.items()}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (args.out / "cxsecret_mapping_codepoints.json").write_text(
        json.dumps({f"U+{src:04X}": f"U+{dst:04X}" for src, dst in CONFIRMED_MAPPING.items()}, indent=2),
        encoding="ascii",
    )
    write_decoded_blocks(entries, args.out / "decoded_font_cxsecret_blocks.txt")

    print(f"Wrote {font_path}")
    print(f"Wrote {args.out / 'cxsecret_glyphs.png'}")
    print(f"Wrote {args.out / 'decoded_font_cxsecret_blocks.txt'}")


if __name__ == "__main__":
    main()
