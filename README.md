# ai-painter-wechat-miniprogram

AI 绘画 Agent 微信小程序 —— 支持文生图（Text-to-Image）和图生图（Image-to-Image），兼容 OpenAI 图像生成 API 及同类接口。

## 功能特性

- **文生图** — 输入提示词，AI 根据描述生成图片
- **图生图** — 上传参考图片，AI 在此基础上创作新图
- **多协议支持** — OpenAI 兼容接口 (`/images/generations`)、OpenAI 图像编辑 (`/images/edits`)、自定义 JSON POST
- **快速标签** — 一键追加高质量、电影级、动漫风、水彩、油画、赛博朋克等风格标签
- **随机灵感** — 内置 8 组精选提示词，随机填入激发创意
- **高级参数** — 负向提示词、图片尺寸、生成数量、质量/风格、相似度（strength）、种子（seed）
- **配置预设** — 保存/加载多套 API 配置，快速切换不同后端
- **生成历史** — 自动保存最近 60 条生成记录，支持预览、下载、复制和重用提示词
- **暗色/亮色主题** — 跟随系统或手动切换
- **请求取消** — 支持中止正在进行的生成任务
- **连接测试** — 一键验证 API 地址和密钥是否可用
- **数据本地化** — 所有配置和历史记录仅存储在设备本地

## 项目结构

```
ai-painter-miniapp/
├── app.js                  # 小程序入口，主题管理
├── app.json                # 全局配置
├── app.wxss                # 全局样式与 CSS 变量（暗色/亮色主题）
├── project.config.json     # 微信开发者工具项目配置
├── sitemap.json            # 站点索引配置
├── pages/
│   └── index/
│       ├── index.js        # 主页面逻辑
│       ├── index.wxml      # 主页面模板
│       ├── index.wxss      # 主页面样式
│       └── index.json      # 页面配置
└── utils/
    ├── api.js              # API 请求封装（图像生成、连接测试、响应解析）
    └── storage.js          # 本地存储封装
```

## 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 微信小程序基础库 >= 3.3.4
- 一个提供 OpenAI 兼容 API 的图像生成服务（可使用 OpenAI 官方、Stable Diffusion WebUI API、或其他第三方代理）

### 导入项目

1. 打开微信开发者工具，点击"导入项目"
2. 选择 `D:\ai-painter-miniapp` 目录
3. 填入 AppID（开发调试可用测试号）
4. 点击"确定"导入

### 开发调试配置

在微信开发者工具中：
- 点击右上角"详情" → "本地设置"
- 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

### 使用步骤

1. **配置 API**：填写请求地址（如 `https://api.openai.com/v1`）、API 密钥、模型名称（如 `dall-e-3`）
2. **选择协议**：根据后端服务选择对应接口协议
3. **编写提示词**：描述想要的画面，可使用底部的快速标签追加风格关键词
4. **切换模式**：选择"文生图"或"图生图"；图生图模式下需上传参考图片
5. **调整参数**：展开"高级参数"设置尺寸、数量、负向提示词等
6. **开始生成**：点击"✨ 开始生成"按钮，等待 AI 创作
7. **查看结果**：生成完成后可在结果区预览、下载或重用提示词

## API 协议说明

### OpenAI 兼容 (`/images/generations`)

标准 OpenAI 图像生成接口格式，适用于 OpenAI 官方及各类兼容代理。

```json
{
  "model": "dall-e-3",
  "prompt": "a white cat...",
  "n": 1,
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid",
  "response_format": "b64_json"
}
```

### OpenAI 图像编辑 (`/images/edits`)

用于图生图模式，以 `multipart/form-data` 方式上传图片。

### 自定义 JSON (POST)

POST 请求到指定地址，请求体与 OpenAI 兼容格式一致，适合自定义后端。

## 响应解析

小程序会自动尝试从 API 响应中提取图片，支持的响应字段：

- `data[].b64_json` — Base64 编码的图片数据
- `data[].url` — 图片 URL
- `images[]` — 图片数组
- `output[]` / `result[]` — 其他常见字段
- 纯字符串 Base64 / data: URL / http URL

## 配置预设

可通过"预设"面板保存当前的 API 配置（地址、密钥、模型、协议），方便在不同后端之间快速切换。

## 注意事项

- 所有数据（API 密钥、历史记录等）仅存储在设备本地，不会上传到任何服务器
- 图生图模式需授权相册访问权限
- 生成历史最多保存 60 条记录，超出自动移除旧记录
- API 密钥请妥善保管，不要分享给他人
