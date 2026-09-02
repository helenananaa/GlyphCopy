# GlyphCopy 实现原理与开发说明

本文面向希望了解实现、修改扩展或重建字形指纹字典的开发者。普通用户请阅读[项目首页](../README.md)和[安装教程](INSTALL.zh-CN.md)。

## 工作原理

GlyphCopy 扫描页面中的可疑 `@font-face` 规则，尤其是 `font-cxsecret` 和内嵌 data URI 字体。扩展解析字体的 `cmap` 表，收集页面实际使用的码点，将字形渲染为 28×28 指纹，并与内置常用中文字形字典进行匹配。候选结果还会通过 canvas 位图和投影评分复核。

识别结果保存在 `chrome.storage.local`，缓存键名格式为：

```text
glyphcopy:mapping:<fontHash>
```

缓存同时保存自动映射和 `manualMapping`。替换页面文字时优先采用人工修正，再回退到自动映射。持久化和导出的缓存会移除字形预览 data URL，以减少存储占用。

## 主要实现

- 扫描可疑字体以及使用这些字体的文本节点。
- 递归检查可访问的同源文档和 iframe。
- 只处理当前页面实际出现的码点。
- 将人工修正置于自动识别结果之前。
- 支持应用替换与当前页面会话内撤销。
- 支持域名级自动替换、低频轮询和 DOM 变化重试。
- 支持映射缓存的导入与导出。

## 项目结构

```text
extension/
  manifest.json                         Chrome MV3 扩展清单
  content/content.js                    扫描、识别、替换和自动替换逻辑
  popup/                                扩展弹窗界面
  data/glyph-fingerprints-noto-sans-sc.json
                                        内置字形指纹字典
tools/
  analyze_cxsecret_har.py               从 HAR 提取字体和解码样例
  build_glyph_fingerprint_dict.py       重建字形指纹字典
docs/
  INSTALL.zh-CN.md                      用户安装教程
  bugfix-plan.md                        历史修复计划和验证清单
artifacts/                              本地生成产物，已 gitignore
output/                                 本地浏览器 profile/runtime，已 gitignore
```

## Python 工具

安装依赖：

```powershell
python -m pip install beautifulsoup4 fonttools pillow
```

从本地 HAR 提取样例字体和解码片段：

```powershell
python .\tools\analyze_cxsecret_har.py .\mooc1.chaoxing.com1.har
```

重建内置字形指纹字典：

```powershell
python .\tools\build_glyph_fingerprint_dict.py
```

如果自动字体发现没有找到合适的中文字体，可以显式指定：

```powershell
python .\tools\build_glyph_fingerprint_dict.py --font <中文字体文件路径>
```

HAR 文件和浏览器 profile 可能包含 Cookie、Token、课程内容或其他本地状态，请勿提交到仓库。

## 验证

修改代码后执行静态检查：

```powershell
git diff --check
python -m py_compile .\tools\analyze_cxsecret_har.py .\tools\build_glyph_fingerprint_dict.py
```

存在本地样例 HAR 时，可执行冒烟测试：

```powershell
python .\tools\analyze_cxsecret_har.py .\mooc1.chaoxing.com1.har
python .\tools\build_glyph_fingerprint_dict.py
```

修改扩展代码后，应重新加载已解压扩展，并在真实页面验证扫描、识别、应用、撤销、人工修正、导入/导出和自动替换。

## 已知约束

- 扩展权限仅覆盖 `*.chaoxing.com` 和 `*.xuexitong.com`。
- 顶层页面脚本不能直接读取跨源 iframe。匹配权限范围的子 frame 可以注入自己的 content script。
- 识别质量依赖内置候选字典以及重建指纹字典时使用的字体。
- 低置信度结果只在扩展弹窗中提示，页面正文不会被额外标记。

