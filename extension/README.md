# GlyphCopy Extension

This folder is the unpacked Chrome/Edge MV3 extension for GlyphCopy. The
extension targets Chaoxing (`*.chaoxing.com`) pages that render readable text
through custom obfuscated fonts.

For the full project overview, tool commands, and validation checklist, see the
repository README at `..\README.md`.

## Runtime Scope

- Finds suspicious `@font-face` rules on Chaoxing pages.
- Prioritizes `font-cxsecret` and embedded data URI fonts.
- Decodes embedded font bytes and calculates a SHA-256 font hash.
- Parses the font `cmap` table to isolate covered codepoints.
- Scans accessible same-origin documents and iframes from the top page.
- Loads into matching frames through `all_frames` and `match_about_blank`.
- Collects text nodes rendered with the suspicious font family.
- Reports suspicious characters, codepoints, counts, and samples in the popup.
- Recognizes glyphs by 28x28 fingerprint matching plus canvas rescoring.
- Reuses partial caches by matching only missing observed codepoints.
- Applies cached or freshly recognized mappings only under the matching font.
- Restores original page text during the current page session.
- Supports domain-wide Chaoxing auto apply with diagnostics and retry.

## Popup Actions

- Scan: detect suspicious fonts and current-page glyph usage.
- Recognize: refresh mapping candidates for observed glyphs.
- Apply replacement: replace text nodes using manual mappings first, then
  automatic mappings.
- Restore original: undo replacements made during the current page session.
- Import/export mapping: move mapping-cache JSON between local profiles.
- Auto apply: persist a Chaoxing-domain setting that scans, recognizes, and
  applies replacement on later page loads.

Low-confidence recognition rows are highlighted in the popup only. GlyphCopy
does not currently mark low-confidence text on the page itself.

## Local Install

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable developer mode.
3. Load the current folder as the unpacked extension:

   ```text
   extension/
   ```

4. Open a Chaoxing page and click the GlyphCopy toolbar icon.

## Storage

Mapping entries are stored in `chrome.storage.local` using:

```text
glyphcopy:mapping:<fontHash>
```

Automatic mappings are stored in `mapping`; user corrections are stored in
`manualMapping`. Replacement uses `manualMapping` over `mapping`.

Auto apply state is stored separately under `glyphcopy:autoApply:*` keys.

## Fingerprint Dictionary

The bundled dictionary lives at:

```text
data/glyph-fingerprints-noto-sans-sc.json
```

From the repository root, rebuild it with:

```powershell
python .\tools\build_glyph_fingerprint_dict.py
```
