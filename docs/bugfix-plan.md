# GlyphCopy Bugfix Execution Plan

This document turns the confirmed review findings into an ordered repair plan.
It is written for small, reviewable commits: complete one phase, validate it,
then move to the next one.

## Scope

Confirmed issues to fix:

- Empty recognition candidates can persist `mapping[source] = ""` and delete
  page text during replacement.
- Recognition cache stores `glyphPreview` PNG data URLs, which can exhaust
  `chrome.storage.local`.
- `classList.contains(family)` throws when the font family contains whitespace.
- `applyMappings()` can run concurrently from popup, replacement observer, and
  auto apply.
- Auto apply observers watch attributes across the whole subtree, causing
  excessive rescans on dynamic pages.
- Enabling auto apply can trigger duplicate apply paths.
- Unsupported pages leave the auto-apply toggle enabled in the popup.
- Cross-frame injection is incomplete for cross-origin/about:blank iframe cases.
- Tool scripts have hardcoded fonts and fragile parsing/error handling.

Out of scope for this plan:

- Rewriting the glyph matching algorithm.
- Adding new UI features.
- Changing the storage schema beyond stripping nonessential preview data.

## Phase 1: Prevent Data Loss

Goal: never write or apply an empty automatic target.

Files:

- `extension/content/content.js`
- Optional focused test fixture or manual test page if one is added later.

Steps:

1. In `recognizeFont()`, after calculating `best`, skip the source codepoint
   when no candidate exists.
   - Treat `!best.char` as "unrecognized".
   - Prefer also skipping when `best.score <= 0`, unless there is a deliberate
     reason to store zero-confidence mappings.
   - Do not write `mapping[sourceChar]`, `confidence[sourceChar]`, or an entry
     with an empty target.

2. Add defensive filtering before applying mappings.
   - In `effectiveMappingForRecognition()` or immediately before
     `applyMappingToFont()`, remove entries whose value is not a non-empty
     string.
   - Keep manual mappings subject to the same rule unless a future explicit
     "delete this glyph" feature is designed.

3. Fix replacement statistics at the same time.
   - In `applyMappingToFont()`, count changed characters by checking
     `Object.prototype.hasOwnProperty.call(mapping, char)` and comparing decoded
     output, not by `mapping[char]` truthiness.
   - This prevents empty strings and identity mappings from distorting counts.

Validation:

1. Temporarily force an empty candidate case by making dictionary load fail and
   fallback candidates empty in a local debug branch, or use a small test harness
   around `recognizeFont()`.
2. Confirm recognition does not store empty targets.
3. Confirm applying mappings never deletes text for missing candidates.
4. Run:

   ```powershell
   git diff --check
   ```

Expected result:

- Unknown glyphs remain visible on the page.
- Cache entries contain only non-empty automatic mappings.

## Phase 2: Reduce Storage Size

Goal: keep previews available for the popup response, but not persisted in
`chrome.storage.local`.

Files:

- `extension/content/content.js`
- `extension/popup/popup.js` only if import/export filtering is needed.

Steps:

1. Add a helper such as `recognitionForStorage(recognition)`.
   - Deep-copy `entries`.
   - Remove `glyphPreview` from every entry before storage.
   - Preserve `source`, `target`, `confidence`, `candidates`, manual fields,
     cache stats, and timestamps.

2. In `recognizeFont()`, return the full recognition with previews to the popup,
   but call `storageSet(fontScan.cacheKey, recognitionForStorage(...))`.

3. Consider also stripping `glyphPreview` during popup export.
   - Existing cache entries may already contain previews.
   - `collectMappingCacheEntries()` or export path should remove previews so
     exported JSON does not preserve the old bloat.

4. Do not remove preview generation from the live recognition response. The UI
   still uses it for inspection.

Validation:

1. Run recognition on a real Chaoxing page.
2. Inspect `chrome.storage.local` for `glyphcopy:mapping:<hash>`.
3. Confirm stored `entries[]` do not contain `glyphPreview`.
4. Confirm the popup still shows previews immediately after recognition.
5. Reopen the popup and confirm cached entries still render with text fallback
   if no preview exists.

Expected result:

- Storage grows mainly with mapping data, not base64 PNG data.
- Popup remains usable with cached entries.

## Phase 3: Fix Font-Family Root Detection Crash

Goal: scanning must not throw for font families such as `"Noto Sans SC"`.

Files:

- `extension/content/content.js`

Steps:

1. Replace the raw `classList.contains(family)` call in
   `collectCandidateRoots()`.
2. Only check class names when `family` is a valid single CSS class token.
   - A simple guard is `family && !/\s/.test(family)`.
   - Better: wrap the class lookup in a tiny helper that catches `DOMException`
     and returns false.
3. Keep computed-style detection as the main font-family detector.

Validation:

1. Open or create a page with:

   ```css
   @font-face {
     font-family: "Noto Sans SC";
     src: url(data:font/ttf;base64,...);
   }
   ```

2. Confirm popup scan returns a structured result rather than an error.
3. Confirm no console exception is thrown from `classList.contains`.

Expected result:

- Data URI fonts with normal multi-word family names no longer break scanning.

## Phase 4: Serialize Apply Operations

Goal: avoid duplicate heavy scans and races between popup apply, replacement
observer, and auto apply.

Files:

- `extension/content/content.js`

Steps:

1. Add a module-level `let applyingPromise = null;`.
2. Rename the current body of `applyMappings()` to an internal function such as
   `applyMappingsOnce(options)`.
3. Make `applyMappings(options)` return the existing `applyingPromise` when one
   is running.
   - If callers need their own `automatic` or `fromObserver` flag reflected in
     the response, document that concurrent callers receive the in-flight result.
   - This is acceptable because the operation mutates the same page state.
4. Clear `applyingPromise` in `finally`.
5. Keep `autoApplyRunning`; it still controls auto scheduler diagnostics.

Validation:

1. Enable auto apply and quickly click manual apply.
2. Confirm only one heavy scan/recognition run happens at a time.
3. Confirm both callers receive a valid response or the same error.
4. Confirm replacement observers still work after late DOM changes.

Expected result:

- No overlapping full-page recognition/apply runs.
- Lower CPU spikes during first recognition.

## Phase 5: Lower Auto-Apply Mutation Cost

Goal: avoid rescanning on unrelated CSS/class/hover/progress mutations.

Files:

- `extension/content/content.js`

Steps:

1. In `installAutoApplyObservers()`, remove `attributes: true`.
2. Keep `childList: true`, `characterData: true`, and `subtree: true`.
3. Consider ignoring mutations caused by GlyphCopy replacements.
   - A simple first pass is enough: serialization from Phase 4 plus the 900 ms
     debounce should prevent the worst overlap.
   - If pages still loop, add a short `suppressAutoApplyMutationUntil` timestamp
     around `textNode.nodeValue = after`.
4. Keep replacement observers separate for now, but do not let them create
   concurrent `applyMappings()` calls because Phase 4 serializes them.

Validation:

1. On a dynamic Chaoxing video/task page, enable auto apply.
2. Watch content-script diagnostics in the popup.
3. Confirm class/progress changes do not constantly schedule immediate rescans.
4. Confirm late-loaded text nodes are still replaced.

Expected result:

- Fewer mutation-triggered runs.
- Less main-thread pressure on video/progress-heavy pages.

## Phase 6: Remove Duplicate Auto-Apply Starts

Goal: one user action should produce one initial apply path.

Files:

- `extension/content/content.js`
- `extension/popup/popup.js`

Steps:

1. Choose one source of truth for starting auto apply after storage changes.
   Recommended: let the content script start immediately in
   `setAutoApplyState(true)`, and suppress the matching `storage.onChanged`
   callback in the same document.

2. Add a small local suppression marker.
   - Before `storageSet(current.scope.key, next)`, set
     `suppressNextAutoApplyStorageChangeForKey = current.scope.key`.
   - In `chrome.storage.onChanged`, if the changed key matches the suppression
     marker, clear the marker and return.

3. In the popup `setAutoApply(true)` path, consider removing the immediate
   `applyCurrentTab()` call.
   - The content script already calls `startAutoApply("enabled", 0)`.
   - If the popup needs a visible result immediately, wait briefly and call
     `refreshAutoApplyState()` instead of running another apply.

4. Keep manual `应用替换` button behavior unchanged.

Validation:

1. Toggle auto apply on.
2. Confirm diagnostics show one initial run, not two or three overlapping starts.
3. Confirm popup state refreshes after the run.

Expected result:

- Auto apply starts once per toggle.
- First-run behavior remains visible to the user.

## Phase 7: Fix Unsupported Popup State

Goal: on pages without a receiving content script, the auto-apply toggle should
not invite a failing action.

Files:

- `extension/popup/popup.js`

Steps:

1. Change `renderAutoApply(null)` so `autoApplyToggle.disabled = true`.
2. Keep the meta text explaining that the current page is unavailable.
3. In `refreshAutoApplyState()`, leave the toggle disabled when message sending
   fails.
4. Ensure `scanCurrentTab()` still shows the existing "no content script"
   message for unsupported pages.

Validation:

1. Open `chrome://extensions` or another unsupported page.
2. Open the popup.
3. Confirm the auto-apply toggle is disabled.
4. Confirm no sendMessage error appears from toggling, because toggling is not
   possible.

Expected result:

- Unsupported pages fail closed in the UI.

## Phase 8: Improve Frame Coverage

Goal: inject the content script into relevant frames instead of relying only on
top-page same-origin recursion.

Files:

- `extension/manifest.json`
- `extension/content/content.js`

Steps:

1. Add the manifest fields:

   ```json
   "all_frames": true,
   "match_about_blank": true
   ```

   under the existing `content_scripts[0]` entry.

2. Re-check content-script top-frame guards.
   - Auto apply currently returns early when `window.top !== window`.
   - That is good for avoiding independent schedulers in every frame.
   - Scan/message behavior in subframes must be understood before changing it.

3. Decide whether popup messages should target only the top frame.
   - Current popup sends messages to the tab without a frame id, so the top
     content script remains the main coordinator.
   - With `all_frames`, subframe scripts may exist but should not create
     duplicate auto schedulers.

4. Validate cross-origin frame expectations.
   - Top script cannot directly read cross-origin frame DOM.
   - `all_frames` allows each matching frame URL to have its own content script,
     but top-popup coordination may need explicit frame messaging if Chaoxing
     uses cross-origin matching frames.
   - If cross-origin frame replacement is required, add a later phase to collect
     frame results through `chrome.runtime` messaging.

Validation:

1. Reload the unpacked extension after manifest change.
2. Open a page with same-origin nested iframe and confirm current behavior still
   works.
3. Open a page with matching Chaoxing iframe and confirm the script is injected
   there.
4. Confirm auto apply still has only one scheduler in the top frame.

Expected result:

- Same-origin behavior remains intact.
- Matching child frames are prepared for direct content-script handling.

## Phase 9: Harden Tool Scripts

Goal: make local tools fail with clear messages and work across machines.

Files:

- `tools/analyze_cxsecret_har.py`
- `tools/build_glyph_fingerprint_dict.py`

Steps for `analyze_cxsecret_har.py`:

1. Replace:

   ```python
   cmap = next(table.cmap for table in font["cmap"].tables if table.isUnicode())
   ```

   with a safe lookup that raises `SystemExit("No Unicode cmap found ...")`.

2. Make label font configurable:
   - Add `--label-font`.
   - Try common Windows fonts only as fallback.
   - If none exists, use `ImageFont.load_default()` for labels.

Steps for `build_glyph_fingerprint_dict.py`:

1. Keep `--font`, but remove the assumption that
   a specific local font path exists.
2. Add font discovery for common Windows fonts, for example Microsoft YaHei or
   SimSun, and require `--font` if no default exists.
3. Improve the error message to say exactly which font path was missing.
4. Replace fragile JS constant parsing with a parser that supports at least:
   - double-quoted strings,
   - single-quoted strings,
   - template strings without interpolation,
   - adjacent string concatenation.

Validation:

1. On Windows, run:

   ```powershell
   python .\tools\analyze_cxsecret_har.py .\mooc1.chaoxing.com1.har
   python .\tools\build_glyph_fingerprint_dict.py
   ```

2. Run with an invalid font path and confirm the error is readable.
3. If possible, run in a non-Windows shell with `--font <known-font-path>`.

Expected result:

- Tools no longer crash with cryptic `OSError` or `StopIteration`.
- Dictionary generation remains deterministic when the same font is supplied.

## Phase 10: Clean Up Minor UI and Reporting Issues

Goal: remove misleading status/reporting behavior without changing core logic.

Files:

- `extension/content/content.js`
- `extension/popup/popup.js`

Steps:

1. Extract the low-confidence threshold in content script into a named constant.
   - Match popup's `LOW_CONFIDENCE_THRESHOLD = 0.78`.
   - This still duplicates across files, but removes magic numbers in content.

2. In `saveAutoApplyResult()`, stop preserving an old non-zero
   `lastResult.changedCharacterCount` when the current run changed zero chars.
   - Prefer showing the latest result.
   - If historical success is useful, add a separate `lastNonZeroResult` later.

3. Remove unused `sourcePreview` from scan results, or render it in popup if it
   is genuinely useful.
   - Current popup does not use it.

4. Revoke object URLs more predictably in `downloadJson()`.
   - Use `try/finally` around `link.click()` and schedule revoke immediately
     after the click.
   - This is low risk and mostly hygiene.

5. Accept that re-rendering recognition drops unsaved manual input unless a
   larger UI state preservation pass is desired.
   - If fixing now, collect current `.manual-target` values before render and
     restore matching values afterward.

Validation:

1. Run normal scan, recognize, apply, restore flows.
2. Export mappings once.
3. Confirm no user-visible regression in popup layout.

Expected result:

- Diagnostics reflect current behavior more accurately.
- Minor memory/resource hygiene improves.

## Final Validation Checklist

After all phases:

1. Reload the unpacked extension from:

   ```text
   <repo>/extension
   ```

2. On a Chaoxing page:
   - scan finds suspicious fonts,
   - recognize produces mappings,
   - apply replaces text,
   - restore recovers original text,
   - manual corrections override automatic mappings,
   - auto apply can be toggled on/off,
   - late-loaded text is handled,
   - unsupported pages disable unavailable controls.

3. Inspect storage:
   - no empty automatic mappings,
   - no stored `glyphPreview` data URLs,
   - cache keys are still `glyphcopy:mapping:<fontHash>`.

4. Run static checks:

   ```powershell
   git diff --check
   python -m py_compile .\tools\analyze_cxsecret_har.py .\tools\build_glyph_fingerprint_dict.py
   ```

5. Run tool smoke tests where local sample files exist:

   ```powershell
   python .\tools\analyze_cxsecret_har.py .\mooc1.chaoxing.com1.har
   python .\tools\build_glyph_fingerprint_dict.py
   ```

## Recommended Commit Order

1. `fix: prevent empty glyph mappings from deleting text`
2. `fix: keep glyph previews out of persistent storage`
3. `fix: handle multi-word font family scanning`
4. `fix: serialize page replacement runs`
5. `perf: reduce auto-apply mutation rescans`
6. `fix: avoid duplicate auto-apply startup`
7. `fix: disable auto apply on unsupported pages`
8. `fix: inject content script into matching frames`
9. `fix: harden glyph tooling across environments`
10. `chore: clean up diagnostics and popup hygiene`
