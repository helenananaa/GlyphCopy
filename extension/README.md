# GlyphCopy Extension

Chrome MV3 prototype for extracting Chaoxing font-obfuscated text.

## Current scope

- Finds inline `@font-face` rules on `*.chaoxing.com`.
- Prioritizes `font-cxsecret` and embedded data URI fonts.
- Decodes embedded font bytes and calculates a SHA-256 font hash.
- Parses the font `cmap` table so the popup can isolate characters actually
  covered by the suspicious font.
- Recursively scans same-origin iframes, which is required for Chaoxing work
  pages where `doHomeWorkNew` is nested under the chapter page.
- Collects text nodes rendered with the suspicious font family.
- Reports suspicious characters, codepoints, counts, and sample text in the popup.
- Popup `刷新识别` converts each suspicious glyph into a 28x28 fingerprint,
  ranks it against the bundled common-Chinese glyph dictionary, then rerenders
  the top matches in canvas for final bitmap/projection scoring.
  Recognition is incremental: if a font hash already has a partial cache, only
  observed codepoints missing from that cache are matched and merged back.
- Checks `chrome.storage.local` for the mapping cache key:
  `glyphcopy:mapping:<fontHash>`.
- Popup `应用替换` applies cached or freshly recognized mappings only to text
  nodes under the matching suspicious font. `恢复原文` restores the original text
  in the current page session.

## Local install

1. Open `chrome://extensions`.
2. Enable developer mode.
3. Load unpacked extension from this folder:
   `H:\program\GlyphCopy\extension`.
4. Open a Chaoxing page and click the GlyphCopy toolbar icon.

## Next step

Improve replacement:

1. Add a manual correction UI for low-confidence mappings.
2. Persist user-confirmed mappings separately from auto mappings.
3. Add import/export for cached mappings.

## Fingerprint dictionary

The bundled dictionary lives at `data/glyph-fingerprints-noto-sans-sc.json` and
is generated from `tools/build_glyph_fingerprint_dict.py`.

```powershell
python .\tools\build_glyph_fingerprint_dict.py
```
