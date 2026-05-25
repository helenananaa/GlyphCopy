const MESSAGE_SCAN = "GLYPHCOPY_SCAN";
const MESSAGE_RECOGNIZE = "GLYPHCOPY_RECOGNIZE";
const MESSAGE_APPLY = "GLYPHCOPY_APPLY";
const MESSAGE_RESTORE = "GLYPHCOPY_RESTORE";
const MESSAGE_GET_AUTO_APPLY = "GLYPHCOPY_GET_AUTO_APPLY";
const MESSAGE_SET_AUTO_APPLY = "GLYPHCOPY_SET_AUTO_APPLY";
const CACHE_PREFIX = "glyphcopy:mapping:";
const LOW_CONFIDENCE_THRESHOLD = 0.78;

const statusElement = document.querySelector("#status");
const summaryElement = document.querySelector("#summary");
const recognitionElement = document.querySelector("#recognition");
const replacementElement = document.querySelector("#replacement");
const fontsElement = document.querySelector("#fonts");
const scanButton = document.querySelector("#scanButton");
const recognizeButton = document.querySelector("#recognizeButton");
const applyButton = document.querySelector("#applyButton");
const restoreButton = document.querySelector("#restoreButton");
const copyButton = document.querySelector("#copyButton");
const autoApplyToggle = document.querySelector("#autoApplyToggle");
const autoApplyMeta = document.querySelector("#autoApplyMeta");

let latestScan = null;
let latestRecognition = null;
let latestReplacement = null;
let latestAutoApply = null;

function setStatus(text) {
  statusElement.textContent = text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shortHash(hash) {
  return hash ? `${hash.slice(0, 12)}...${hash.slice(-8)}` : "未取得";
}

async function storageGet(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => resolve(result[key]));
  });
}

async function storageSet(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

function renderSummary(scan) {
  summaryElement.hidden = false;
  summaryElement.innerHTML = `
    <div>页面：${escapeHtml(scan.title || scan.url)}</div>
    <div>扫描文档/iframe：${scan.documentCount ?? 1} 个</div>
    <div>发现 @font-face：${scan.fontFaceCount} 个，可疑字体：${scan.candidateCount} 个</div>
    <div>扫描时间：${escapeHtml(scan.scannedAt)}</div>
  `;
}

function renderFont(font) {
  const chars = font.text.suspiciousChars.slice(0, 32);
  const firstSample = font.text.samples[0] || "";
  const badgeClass = font.cacheHit ? "badge hit" : "badge";
  const badgeText = font.cacheHit ? "缓存命中" : "未缓存";

  return `
    <article class="font-card">
      <div class="font-head">
        <div class="font-title">${escapeHtml(font.family)}</div>
        <span class="${badgeClass}">${badgeText}</span>
      </div>
      <div class="meta">
        <div>来源：<code>${escapeHtml(font.cssSource)}</code></div>
        <div>文档：<code>${escapeHtml(font.documentPath)} ${escapeHtml(font.documentTitle || "")}</code></div>
        <div>类型：${escapeHtml(font.sourceType)}，大小：${font.byteLength ?? "未知"} bytes</div>
        <div>Hash：<code>${escapeHtml(shortHash(font.fontHash))}</code></div>
        <div>字体 cmap：${font.fontCodePoints?.length ?? 0} 个码点，当前页出现：${font.observedCodePointCount ?? 0} 个</div>
        <div>缓存：${font.cachedMappingCount ?? 0} 个，当前页已覆盖：${font.observedMappingCount ?? 0} 个，缺失：${font.missingObservedCodePointCount ?? 0} 个</div>
        <div>节点：${font.text.rootCount} 个根元素，${font.text.textNodeCount} 个文本节点</div>
      </div>
      ${
        firstSample
          ? `<div class="sample">${escapeHtml(firstSample)}</div>`
          : `<div class="sample">没有抓到使用此字体的文本。</div>`
      }
      ${
        chars.length
          ? `<div class="char-grid">${chars
              .map(
                (item) => `
                  <div class="char-cell">
                    <span class="char">${escapeHtml(item.char)}</span>
                    <span class="char-meta">${escapeHtml(item.codePoint)} x${item.count}</span>
                  </div>
                `,
              )
              .join("")}</div>`
          : ""
      }
    </article>
  `;
}

function renderFonts(scan) {
  if (!scan.fonts.length) {
    fontsElement.innerHTML = '<div class="empty">没有发现内嵌可疑字体。</div>';
    return;
  }

  fontsElement.innerHTML = scan.fonts.map(renderFont).join("");
}

function renderRecognition(recognition) {
  recognitionElement.hidden = false;

  if (!recognition.results.length) {
    recognitionElement.innerHTML = "没有可识别字体。";
    return;
  }

  recognitionElement.innerHTML = recognition.results
    .map((result) => {
      if (result.error) {
        return `<div>识别失败：${escapeHtml(result.family)}，${escapeHtml(result.error)}</div>`;
      }

      const manualCount = result.manualMappingCount ?? Object.keys(result.manualMapping || {}).length;
      const lowConfidenceCount = result.entries.filter((entry) => !entry.manual && entry.confidence < LOW_CONFIDENCE_THRESHOLD).length;
      const rows = result.entries
        .map(
          (entry) => `
            <div class="recognition-row ${entry.manual ? "manual" : ""} ${
              !entry.manual && entry.confidence < LOW_CONFIDENCE_THRESHOLD ? "low-confidence" : ""
            }">
              <div class="glyph-preview" title="${escapeHtml(`${entry.source} ${entry.codePoint || ""}`)}">
                ${
                  entry.glyphPreview
                    ? `<img src="${escapeHtml(entry.glyphPreview)}" alt="${escapeHtml(entry.codePoint || "glyph")}" />`
                    : `<strong>${escapeHtml(entry.source)}</strong>`
                }
              </div>
              <input
                class="manual-target"
                maxlength="2"
                value="${escapeHtml(entry.target || "")}"
                data-font-hash="${escapeHtml(result.fontHash)}"
                data-source="${escapeHtml(entry.source)}"
                aria-label="修正 ${escapeHtml(entry.source)} 的映射"
              />
              <span title="${escapeHtml(
                (entry.candidates || [])
                  .map((item) => `${item.char} ${Math.round(item.score * 100)}%`)
                  .join(" / "),
              )}">
                ${entry.manual
                  ? `人工，自动：${escapeHtml(entry.autoTarget || "无")}`
                  : escapeHtml(
                      (entry.candidates || [])
                        .slice(1, 4)
                        .map((item) => item.char)
                        .join(" / "),
                    )}
              </span>
              <em>${Math.round(entry.confidence * 100)}%</em>
            </div>
          `,
        )
        .join("");

      return `
        <div>识别：${escapeHtml(result.family)}，候选字 ${result.candidateCount} 个，canvas 复核 ${
          result.canvasCandidateCount ?? result.candidateCount
        } 个，本次新增 ${
          result.recognizedCodePointCount ?? result.entries.length
        } 个，缓存共 ${result.cachedMappingCount ?? Object.keys(result.mapping || {}).length} 个。</div>
        <div class="recognition-tools">
          <span>人工修正 ${manualCount} 个，低置信度 ${lowConfidenceCount} 个</span>
          <button class="save-manual-button" type="button" data-font-hash="${escapeHtml(result.fontHash)}">保存修正</button>
        </div>
        <div class="recognition-list">${rows}</div>
      `;
    })
    .join("");
}

function renderReplacement(applied) {
  replacementElement.hidden = false;
  const changedNodes = applied.results.reduce((sum, result) => sum + (result.changedNodeCount || 0), 0);
  const changedChars = applied.results.reduce((sum, result) => sum + (result.changedCharacterCount || 0), 0);
  const skipped = applied.results.filter((result) => result.skipped).length;

  replacementElement.innerHTML = `
    <div>替换完成：${changedNodes} 个文本节点，${changedChars} 个字符。</div>
    ${skipped ? `<div>跳过：${skipped} 个字体/文档。</div>` : ""}
  `;
}

function renderRestore(restored) {
  replacementElement.hidden = false;
  replacementElement.innerHTML = `<div>已恢复：${restored.restoredNodeCount} 个文本节点。</div>`;
}

function cacheKeyForFontHash(fontHash) {
  return `${CACHE_PREFIX}${fontHash}`;
}

function applyManualOverridesToResult(result, manualMapping) {
  const effectiveMapping = {
    ...(result.mapping || {}),
    ...(manualMapping || {}),
  };
  const manualSources = new Set(Object.keys(manualMapping || {}));
  const entries = (result.entries || []).map((entry) => {
    if (!Object.prototype.hasOwnProperty.call(manualMapping || {}, entry.source)) {
      return {
        ...entry,
        manual: false,
        target: result.mapping?.[entry.source] || entry.target,
      };
    }

    return {
      ...entry,
      autoTarget: entry.autoTarget || result.mapping?.[entry.source] || entry.target,
      target: manualMapping[entry.source],
      manual: true,
    };
  });

  return {
    ...result,
    manualMapping,
    manualMappingCount: manualSources.size,
    effectiveMapping,
    effectiveMappingCount: Object.keys(effectiveMapping).length,
    cachedMappingCount: Object.keys(effectiveMapping).length,
    entries,
  };
}

async function saveManualCorrections(fontHash) {
  if (!fontHash || !latestRecognition) {
    return;
  }

  const result = latestRecognition.results.find((item) => item.fontHash === fontHash);
  if (!result) {
    return;
  }

  const cacheKey = cacheKeyForFontHash(fontHash);
  const cached = (await storageGet(cacheKey)) || result;
  const manualMapping = {
    ...(cached.manualMapping || result.manualMapping || {}),
  };
  const inputs = Array.from(recognitionElement.querySelectorAll(`.manual-target[data-font-hash="${CSS.escape(fontHash)}"]`));

  for (const input of inputs) {
    const source = input.dataset.source;
    const value = Array.from(input.value.trim())[0] || "";
    if (!source) {
      continue;
    }

    input.value = value;
    const autoTarget = cached.mapping?.[source] || result.mapping?.[source] || "";
    if (value && value !== autoTarget) {
      manualMapping[source] = value;
    } else {
      delete manualMapping[source];
    }
  }

  const updated = applyManualOverridesToResult(
    {
      ...cached,
      ...result,
      mapping: {
        ...(cached.mapping || {}),
        ...(result.mapping || {}),
      },
    },
    manualMapping,
  );
  updated.manualUpdatedAt = Date.now();
  await storageSet(cacheKey, updated);

  latestRecognition = {
    ...latestRecognition,
    results: latestRecognition.results.map((item) => (item.fontHash === fontHash ? updated : item)),
  };
  renderRecognition(latestRecognition);
  setStatus(`已保存 ${updated.manualMappingCount || 0} 个人工修正。`);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function renderAutoApply(autoApply) {
  latestAutoApply = autoApply;
  autoApplyToggle.checked = Boolean(autoApply?.enabled);
  autoApplyToggle.disabled = false;

  if (!autoApply) {
    autoApplyMeta.textContent = "当前页面不可用";
    return;
  }

  const suffix = autoApply.lastResult
    ? `，上次替换 ${autoApply.lastResult.changedCharacterCount || 0} 字`
    : "";
  autoApplyMeta.textContent = `${autoApply.enabled ? "已开启" : "默认关闭"}：${autoApply.scope?.label || "当前页面"}${suffix}`;
}

async function refreshAutoApplyState() {
  autoApplyToggle.disabled = true;

  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      throw new Error("无法取得当前标签页");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: MESSAGE_GET_AUTO_APPLY });
    if (!response || !response.ok) {
      throw new Error(response?.error || "content script 未返回自动替换状态");
    }

    renderAutoApply(response.autoApply);
  } catch (_error) {
    renderAutoApply(null);
  }
}

async function setAutoApply(enabled) {
  autoApplyToggle.disabled = true;
  setStatus(enabled ? "正在开启自动替换..." : "正在关闭自动替换...");

  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      throw new Error("无法取得当前标签页");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: MESSAGE_SET_AUTO_APPLY, enabled });
    if (!response || !response.ok) {
      throw new Error(response?.error || "content script 未保存自动替换状态");
    }

    renderAutoApply(response.autoApply);
    setStatus(enabled ? "自动替换已开启，正在应用当前页面..." : "自动替换已关闭。");
    if (enabled) {
      await applyCurrentTab();
      await refreshAutoApplyState();
    }
  } catch (error) {
    autoApplyToggle.checked = Boolean(latestAutoApply?.enabled);
    setStatus(error instanceof Error ? error.message : String(error));
  } finally {
    autoApplyToggle.disabled = false;
  }
}

async function scanCurrentTab() {
  scanButton.disabled = true;
  recognizeButton.disabled = true;
  applyButton.disabled = true;
  restoreButton.disabled = true;
  copyButton.disabled = true;
  setStatus("正在扫描当前页面...");

  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      throw new Error("无法取得当前标签页");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: MESSAGE_SCAN });
    if (!response || !response.ok) {
      throw new Error(response?.error || "content script 未返回扫描结果");
    }

    latestScan = response.scan;
    latestRecognition = null;
    latestReplacement = null;
    renderSummary(latestScan);
    recognitionElement.hidden = true;
    replacementElement.hidden = true;
    renderFonts(latestScan);
    copyButton.disabled = false;
    setStatus(`扫描完成，发现 ${latestScan.candidateCount} 个可疑字体。`);
  } catch (error) {
    latestScan = null;
    summaryElement.hidden = true;
    fontsElement.innerHTML = '<div class="empty">当前页面没有可用的 GlyphCopy content script。</div>';
    setStatus(error instanceof Error ? error.message : String(error));
  } finally {
    scanButton.disabled = false;
    recognizeButton.disabled = false;
    applyButton.disabled = false;
    restoreButton.disabled = false;
  }
}

async function recognizeCurrentTab() {
  scanButton.disabled = true;
  recognizeButton.disabled = true;
  applyButton.disabled = true;
  restoreButton.disabled = true;
  copyButton.disabled = true;
  setStatus("正在渲染字形并匹配候选字...");

  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      throw new Error("无法取得当前标签页");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: MESSAGE_RECOGNIZE });
    if (!response || !response.ok) {
      throw new Error(response?.error || "content script 未返回识别结果");
    }

    latestRecognition = response.recognition;
    latestReplacement = null;
    latestScan = latestRecognition.scan;
    renderSummary(latestScan);
    renderFonts(latestScan);
    renderRecognition(latestRecognition);
    replacementElement.hidden = true;
    copyButton.disabled = false;
    setStatus(`识别完成，处理 ${latestRecognition.results.length} 个字体。`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  } finally {
    scanButton.disabled = false;
    recognizeButton.disabled = false;
    applyButton.disabled = false;
    restoreButton.disabled = false;
  }
}

async function applyCurrentTab() {
  scanButton.disabled = true;
  recognizeButton.disabled = true;
  applyButton.disabled = true;
  restoreButton.disabled = true;
  copyButton.disabled = true;
  setStatus("正在应用缓存映射并替换页面文本...");

  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      throw new Error("无法取得当前标签页");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: MESSAGE_APPLY });
    if (!response || !response.ok) {
      throw new Error(response?.error || "content script 未返回替换结果");
    }

    latestReplacement = response.applied;
    latestScan = latestReplacement.scan;
    if (latestReplacement.recognitions?.length) {
      latestRecognition = {
        scannedAt: latestReplacement.scan.scannedAt,
        url: latestReplacement.scan.url,
        title: latestReplacement.scan.title,
        fontCount: latestReplacement.scan.fonts.length,
        results: latestReplacement.recognitions,
        scan: latestReplacement.scan,
      };
      renderRecognition(latestRecognition);
    }
    renderSummary(latestScan);
    renderFonts(latestScan);
    renderReplacement(latestReplacement);
    copyButton.disabled = false;
    setStatus("替换完成。");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  } finally {
    scanButton.disabled = false;
    recognizeButton.disabled = false;
    applyButton.disabled = false;
    restoreButton.disabled = false;
  }
}

async function restoreCurrentTab() {
  scanButton.disabled = true;
  recognizeButton.disabled = true;
  applyButton.disabled = true;
  restoreButton.disabled = true;
  copyButton.disabled = true;
  setStatus("正在恢复原文...");

  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      throw new Error("无法取得当前标签页");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: MESSAGE_RESTORE });
    if (!response || !response.ok) {
      throw new Error(response?.error || "content script 未返回恢复结果");
    }

    latestReplacement = response.restored;
    renderRestore(response.restored);
    copyButton.disabled = false;
    setStatus("原文已恢复。");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  } finally {
    scanButton.disabled = false;
    recognizeButton.disabled = false;
    applyButton.disabled = false;
    restoreButton.disabled = false;
  }
}

async function copyLatestScan() {
  const payload = latestReplacement || latestRecognition || latestScan;
  if (!payload) {
    return;
  }

  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  setStatus("扫描 JSON 已复制。");
}

scanButton.addEventListener("click", scanCurrentTab);
recognizeButton.addEventListener("click", recognizeCurrentTab);
applyButton.addEventListener("click", applyCurrentTab);
restoreButton.addEventListener("click", restoreCurrentTab);
copyButton.addEventListener("click", copyLatestScan);
autoApplyToggle.addEventListener("change", () => {
  setAutoApply(autoApplyToggle.checked);
});
recognitionElement.addEventListener("click", (event) => {
  const button = event.target.closest(".save-manual-button");
  if (!button) {
    return;
  }

  saveManualCorrections(button.dataset.fontHash).catch((error) => {
    setStatus(error instanceof Error ? error.message : String(error));
  });
});

refreshAutoApplyState();
scanCurrentTab();
