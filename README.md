# GlyphCopy

[English](README.en.md)

解析超星学习通测试章节的字体混淆，可以复制原文而不是乱码。

### 使用前

![使用前：复制出来是乱码](docs/screenshots/before.png)

### 使用后

![使用后：复制出来是原文](docs/screenshots/after.png)

GlyphCopy 是一个本地 Chrome/Edge MV3 扩展，用来检查和替换超星
(`chaoxing.com`) 页面里通过自定义字体做了字形混淆的文本。它面向“页面看起来像
中文，但复制出来是乱码或混淆字符”的场景，帮助你在自己能访问的学习通测试/章节
页面里恢复可复制的原文。

## 快速开始

- 插件安装教程：[docs/INSTALL.zh-CN.md](docs/INSTALL.zh-CN.md)
- 推荐仓库描述：`解析超星学习通测试章节的字体混淆，可以复制原文而不是乱码`
- 截图素材说明：[docs/screenshots/README.md](docs/screenshots/README.md)

项目里也包含两个 Python 工具：一个用于从 HAR 抓包里提取样例字体和解码片段，另一
个用于重建扩展内置的字形指纹字典。

## 能做什么

- 扫描超星页面里的可疑 `@font-face` 规则，尤其是 `font-cxsecret` 和内嵌
  data URI 字体。
- 解析可疑字体的 `cmap` 表，并记录当前页面文本节点实际出现过的码点。
- 递归检查可访问的同源文档和 iframe。
- 把观察到的字形渲染成 28x28 指纹，并与内置常用中文字形字典排序匹配。
- 对候选结果做 canvas 位图/投影复核。
- 将识别结果保存到 `chrome.storage.local`，键名格式为
  `glyphcopy:mapping:<fontHash>`。
- 支持人工修正，并让人工映射优先于自动识别映射。
- 只替换使用匹配可疑字体渲染的页面文本节点，并可在当前页面会话中恢复原文。
- 支持超星域名范围的自动替换开关，带低频轮询、DOM 变化重试和 popup 诊断信息。
- 支持导入/导出映射缓存 JSON，便于复用已经确认过的映射。

## 项目结构

```text
extension/
  manifest.json                         Chrome MV3 扩展清单
  content/content.js                    页面扫描、识别、替换、自动替换逻辑
  popup/                                扩展弹窗 UI
  data/glyph-fingerprints-noto-sans-sc.json
                                        内置字形指纹字典
tools/
  analyze_cxsecret_har.py               从 HAR 提取 cxsecret 字体和解码样例
  build_glyph_fingerprint_dict.py       重建内置字形指纹字典
docs/
  bugfix-plan.md                        历史修复计划和验证清单
artifacts/                              本地生成的分析产物，已 gitignore
output/                                 本地浏览器 profile/runtime 拷贝，已 gitignore
```

## 本地安装扩展

1. 打开 `chrome://extensions` 或 `edge://extensions`。
2. 开启开发者模式。
3. 加载仓库里的扩展目录：

   ```text
   extension/
   ```

4. 打开超星页面，点击浏览器工具栏里的 GlyphCopy 图标。

扩展权限由 `extension/manifest.json` 限定在 `*://*.chaoxing.com/*`。

## Popup 使用流程

1. 扫描当前页面，检测可疑字体和文本节点。
2. 运行识别，为当前页面实际出现过的字形生成或刷新映射缓存。
3. 在识别面板里查看低置信度结果。
4. 对需要修正的字形填写人工映射并保存。
5. 应用替换到页面。
6. 如果当前页面会话需要回滚，可以恢复原文。

自动替换默认关闭。开启后，GlyphCopy 会保存一个超星域名级设置；后续页面加载时会
自动扫描、识别缺失字形并应用映射。没有可疑字体的页面只会被扫描，不会被改动。

## 映射缓存

识别缓存键名格式：

```text
glyphcopy:mapping:<fontHash>
```

缓存里保存自动映射和 `manualMapping`。页面替换时优先使用人工修正，然后再回退到
自动映射。实时 popup 识别结果可以携带字形预览，便于检查；但持久化和导出的缓存会
去掉预览 data URL，避免占用过多 `chrome.storage.local` 空间。

## Python 工具

在你使用的 Python 环境里安装依赖：

```powershell
python -m pip install beautifulsoup4 fonttools pillow
```

从本地 HAR 抓包里提取超星样例字体和解码片段：

```powershell
python .\tools\analyze_cxsecret_har.py .\mooc1.chaoxing.com1.har
```

重建扩展内置的字形指纹字典：

```powershell
python .\tools\build_glyph_fingerprint_dict.py
```

如果默认中文字体发现失败，可以显式指定字体：

```powershell
python .\tools\build_glyph_fingerprint_dict.py --font <中文字体文件路径>
```

HAR 文件、生成产物和浏览器 profile 可能包含 cookie、课程数据或其他本地状态，
这些路径已经通过 `.gitignore` 排除。

## 验证

修改受 git 跟踪的代码后，可以先跑静态检查：

```powershell
git diff --check
python -m py_compile .\tools\analyze_cxsecret_har.py .\tools\build_glyph_fingerprint_dict.py
```

本地存在样例 HAR 时，可以跑工具冒烟测试：

```powershell
python .\tools\analyze_cxsecret_har.py .\mooc1.chaoxing.com1.har
python .\tools\build_glyph_fingerprint_dict.py
```

扩展代码改动后，需要重新加载已解压扩展，并在真实超星页面验证扫描、识别、应用、
恢复、人工修正、导入/导出和自动替换。

## 当前限制

- 扩展只声明超星站点权限。
- 顶层页面脚本不能直接读取跨源 iframe。匹配超星域名的子 frame 可以注入自己的
  content script，但顶层 frame 仍是 popup 通信和自动替换调度的主协调者。
- 识别质量依赖内置候选字典，以及生成
  `glyph-fingerprints-noto-sans-sc.json` 时使用的本地字体。
- 低置信度结果只在 popup 检查面板里高亮；页面内容本身不会被视觉标记。
