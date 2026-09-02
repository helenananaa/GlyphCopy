# GlyphCopy architecture and development guide

This document is for contributors who want to understand the implementation, modify the extension, or rebuild its glyph fingerprint dictionary. Users should start with the [project README](../README.en.md) and the [Chinese installation guide](INSTALL.zh-CN.md).

## How it works

GlyphCopy scans pages for suspicious `@font-face` rules, especially `font-cxsecret` and embedded data URI fonts. It parses each font's `cmap`, collects codepoints actually used on the page, renders the glyphs into 28×28 fingerprints, and compares them with the bundled common-Chinese-glyph dictionary. Top candidates are rechecked using canvas bitmap and projection scores.

Recognition results are stored in `chrome.storage.local` under keys shaped like:

```text
glyphcopy:mapping:<fontHash>
```

Each cache stores automatic mappings and `manualMapping`. Manual corrections take priority during replacement. Persisted and exported caches omit glyph preview data URLs to reduce storage use.

## Main implementation

- Scans suspicious fonts and text nodes rendered with those fonts.
- Recursively inspects accessible same-origin documents and iframes.
- Recognizes only codepoints observed on the current page.
- Gives manual corrections priority over automatic results.
- Applies replacements and supports undo during the current page session.
- Supports domain-wide auto-apply, low-frequency polling, and DOM mutation retries.
- Imports and exports mapping caches.

## Project layout

```text
extension/
  manifest.json                         Chrome MV3 manifest
  content/content.js                    scan, recognition, replacement, auto-apply
  popup/                                extension popup UI
  data/glyph-fingerprints-noto-sans-sc.json
                                        bundled glyph fingerprint dictionary
tools/
  analyze_cxsecret_har.py               extract fonts and decoded samples from HAR
  build_glyph_fingerprint_dict.py       rebuild the fingerprint dictionary
docs/
  INSTALL.zh-CN.md                      user installation guide
  bugfix-plan.md                        historical repair plan and checklist
artifacts/                              local generated outputs, gitignored
output/                                 local browser profiles/runtime, gitignored
```

## Python tools

Install dependencies:

```powershell
python -m pip install beautifulsoup4 fonttools pillow
```

Extract a sample font and decoded blocks from a local HAR capture:

```powershell
python .\tools\analyze_cxsecret_har.py .\mooc1.chaoxing.com1.har
```

Rebuild the bundled fingerprint dictionary:

```powershell
python .\tools\build_glyph_fingerprint_dict.py
```

If automatic font discovery cannot find a suitable Chinese font, provide one explicitly:

```powershell
python .\tools\build_glyph_fingerprint_dict.py --font <path-to-chinese-font>
```

HAR files and browser profiles may contain cookies, tokens, course content, or other local state. Do not commit them.

## Validation

Run static checks after modifying tracked code:

```powershell
git diff --check
python -m py_compile .\tools\analyze_cxsecret_har.py .\tools\build_glyph_fingerprint_dict.py
```

When a local sample HAR is available, run the smoke checks:

```powershell
python .\tools\analyze_cxsecret_har.py .\mooc1.chaoxing.com1.har
python .\tools\build_glyph_fingerprint_dict.py
```

After changing extension code, reload the unpacked extension and verify scanning, recognition, apply, undo, manual correction, import/export, and auto-apply on a real page.

## Known constraints

- Host permissions cover only `*.chaoxing.com` and `*.xuexitong.com`.
- A top-level script cannot directly inspect cross-origin iframes. Frames covered by the manifest can receive their own content script.
- Recognition quality depends on the bundled candidate dictionary and the font used to rebuild it.
- Low-confidence results are highlighted only in the popup; the page itself is not marked.

