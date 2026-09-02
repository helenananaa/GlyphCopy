# GlyphCopy

[English](README.en.md)

**让超星学习通中“页面看得见、复制却是乱码”的文字恢复为可复制文本。**

适用于 Chrome 和 Edge，识别与替换均在浏览器本地完成。

[下载最新版](https://github.com/helenananaa/GlyphCopy/releases/latest) · [完整安装教程](docs/INSTALL.zh-CN.md) · [问题反馈](https://github.com/helenananaa/GlyphCopy/issues)

## 效果对比

### 使用前

![使用前：复制出来是乱码](docs/screenshots/before.png)

### 使用后

![使用后：复制出来是原文](docs/screenshots/after.png)

## 安装与使用

1. [下载最新版](https://github.com/helenananaa/GlyphCopy/releases/latest)，在 Assets 中获取 `GlyphCopy-v0.1.0.zip` 并解压。
2. 打开 `chrome://extensions` 或 `edge://extensions`，开启“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择解压目录中的 `extension` 文件夹。
4. 打开需要处理的学习通页面，点击浏览器工具栏里的 GlyphCopy 图标。
5. 依次点击“扫描”→“刷新识别”→“应用替换”。

如需更详细的分步说明、更新和卸载方法，请阅读[完整安装教程](docs/INSTALL.zh-CN.md)。

## 主要功能

- 识别超星学习通页面使用自定义字体隐藏的文本。
- 将复制后出现乱码的文字替换为可正常复制的内容。
- 支持人工修正低置信度识别结果，人工结果优先于自动识别。
- 支持自动替换后续打开的学习通页面，默认关闭。
- 支持导入和导出映射缓存，便于在不同浏览器或设备间复用。
- 可在当前页面会话中撤销替换，恢复网页最初显示的文本。

## 隐私与权限

- 扩展仅在 `*.chaoxing.com` 和 `*.xuexitong.com` 页面运行。
- 页面扫描、字形识别和文本替换均在本地浏览器中完成。
- 识别结果仅保存在浏览器的 `chrome.storage.local` 中，项目不会上传页面内容。
- HAR、导出的映射文件和截图可能包含课程或账号信息，分享前请先检查并脱敏。

## 当前限制

- 自动识别并非百分之百准确，请检查低置信度结果并在需要时人工修正。
- 顶层脚本无法直接读取跨源 iframe；部分内容可能需要在对应子页面中单独处理。
- 识别质量受页面字体形状及内置候选字典范围影响。
- 目前通过开发者模式加载，尚未发布到 Chrome Web Store 或 Edge Add-ons。

## 文档与开发

- [完整安装教程](docs/INSTALL.zh-CN.md)
- [实现原理与开发说明](docs/DEVELOPMENT.md)
- [MIT License](LICENSE)
- [提交问题或建议](https://github.com/helenananaa/GlyphCopy/issues)
