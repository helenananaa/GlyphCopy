# GlyphCopy

[简体中文](README.md)

**Make text that looks readable on Chaoxing but copies as garbled characters readable and copyable again.**

GlyphCopy supports Chrome and Edge. Recognition and replacement run locally in the browser.

[Download the latest release](https://github.com/helenananaa/GlyphCopy/releases/latest) · [Chinese installation guide](docs/INSTALL.zh-CN.md) · [Report an issue](https://github.com/helenananaa/GlyphCopy/issues)

## Before and after

### Before

![Before: copied text is garbled](docs/screenshots/before.png)

### After

![After: copied text is readable](docs/screenshots/after.png)

## Install and use

1. [Download the latest release](https://github.com/helenananaa/GlyphCopy/releases/latest), get `GlyphCopy-v0.1.0.zip` from Assets, and extract it.
2. Open `chrome://extensions` or `edge://extensions`, then enable Developer mode.
3. Choose “Load unpacked” and select the extracted `extension` folder.
4. Open a supported Chaoxing page and click the GlyphCopy toolbar icon.
5. Click Scan → Refresh Recognition → Apply Replacement.

See the [Chinese installation guide](docs/INSTALL.zh-CN.md) for detailed installation, update, and removal instructions.

## Features

- Detects text hidden behind custom font glyph obfuscation on Chaoxing pages.
- Replaces text that copies as garbled characters with readable, copyable content.
- Supports manual corrections for low-confidence results; manual mappings take priority.
- Can automatically process later Chaoxing pages; auto-apply is disabled by default.
- Imports and exports mapping caches for reuse across browser profiles or devices.
- Can undo replacements during the current page session and restore the page's initial text.

## Privacy and permissions

- The extension runs only on `*.chaoxing.com` and `*.xuexitong.com`.
- Page scanning, glyph recognition, and text replacement happen locally in the browser.
- Recognition results remain in `chrome.storage.local`; the project does not upload page content.
- HAR files, exported mappings, and screenshots may contain course or account information. Review and redact them before sharing.

## Current limitations

- Automatic recognition is not guaranteed to be perfect. Review low-confidence results and correct them when necessary.
- The top-level script cannot directly inspect cross-origin iframes; some content may need to be handled in its own frame.
- Recognition quality depends on the page font and the coverage of the bundled candidate dictionary.
- The extension currently requires Developer mode and is not published in the Chrome Web Store or Edge Add-ons.

## Documentation and development

- [Chinese installation guide](docs/INSTALL.zh-CN.md)
- [Architecture and development guide](docs/DEVELOPMENT.en.md)
- [MIT License](LICENSE)
- [Report a bug or request a feature](https://github.com/helenananaa/GlyphCopy/issues)
