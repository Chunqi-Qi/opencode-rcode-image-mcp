# 使用文档

[← 返回首页](../README.md) · [中文](USAGE.md) · [English](USAGE.en.md)

完整安装、配置、工具参数与故障排查指南。需要快速浏览特性请回到 [项目首页](../README.md)。

## 目录

- [安装](#安装)
- [配置](#配置)
- [Slash Command](#slash-command)
- [使用](#使用)
- [工具](#工具)
- [模型支持](#模型支持)
- [项目结构](#项目结构)
- [开发](#开发)
- [故障排查](#故障排查)

## 安装

要求：Node.js ≥ 18。

```bash
git clone https://github.com/Chunqi-Qi/opencode-rcode-image-mcp.git ~/code/MCP/opencode-rcode-image-mcp
cd ~/code/MCP/opencode-rcode-image-mcp
npm install
npm run build
```

构建产物为 `dist/index.js`，作为 MCP server 入口。

## 配置

### 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `RIGHT_CODES_API_KEY` | ✅ | — | Right Code API Key（`sk-xxx`） |
| `RIGHT_CODES_BASE_URL` | ❌ | `https://www.right.codes/draw` | API 基础地址 |
| `RIGHT_CODES_DOWNLOAD_DIR` | ❌ | `~/Pictures/right-code` | 图片下载根目录 |
| `RIGHT_CODES_TIMEOUT_MS` | ❌ | `300000` | 生图请求和图片下载超时，单位毫秒 |

### OpenCode 注册

在 `~/.config/opencode/opencode.json` 中添加：

```jsonc
{
  "mcp": {
    "opencode-rcode-image": {
      "type": "local",
      "command": ["node", "/Users/xxx/code/MCP/opencode-rcode-image-mcp/dist/index.js"],
      "enabled": true,
      "environment": {
        "RIGHT_CODES_API_KEY": "sk-xxx",
        "RIGHT_CODES_BASE_URL": "https://www.right.codes/draw",
        "RIGHT_CODES_DOWNLOAD_DIR": "~/Pictures/right-code",
        "RIGHT_CODES_TIMEOUT_MS": "300000"
      }
    }
  }
}
```

`command` 中的路径需要替换成本机绝对路径。

## Slash Command

可选的便捷快捷指令，加在 `opencode.json` 的 `command` 字段：

```jsonc
{
  "command": {
    "draw": {
      "description": "生成图片",
      "template": "请使用 opencode-rcode-image MCP 的 generate_image 工具生成图片。根据用户输入解析参数：第一行为提示词，可选 key=value 形式覆盖 model/resolution/aspect_ratio 等参数。默认 model=gpt-image-2, resolution=1K, aspect_ratio=1:1。生成完成后回复图片本地路径和在线 URL，不要额外解释。\n\n用户输入：\n$ARGUMENTS"
    },
    "draw-hd": {
      "description": "高清生图 2K + gpt-image-2-vip",
      "template": "调用 generate_image 工具生成图片，强制 model=gpt-image-2-vip, resolution=2K。提示词：$ARGUMENTS"
    }
  }
}
```

配置后重启 OpenCode 生效。

## 使用

```
/draw 一只穿宇航服的柴犬站在月球表面，写实风格
/draw 赛博朋克城市夜景 model=nano-banana-2 resolution=2K aspect_ratio=16:9
/draw-hd 雨中霓虹街道
```

生成后图片自动保存到 `~/Pictures/right-code/yyyy-mm-dd/`。

## 工具

### generate_image

调用 Right Code 生成图片。默认走 chat 流式通道防止 Cloudflare 超时，失败自动回退 images 同步接口。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `prompt` | string | ✅ | — | 图片描述提示词 |
| `model` | enum | ❌ | `gpt-image-2` | 生图模型 |
| `resolution` | `1K`/`2K`/`4K` | ❌ | `1K` | 分辨率档位 |
| `size` | string | ❌ | — | 像素尺寸如 `1024x1024`，覆盖 resolution+aspect_ratio |
| `aspect_ratio` | `1:1`/`16:9`/... | ❌ | `1:1` | 宽高比 |
| `n` | int (1-4) | ❌ | 1 | 生成数量 |
| `image` | string / string[] | ❌ | — | 参考图 URL 或 base64（图生图） |
| `transport` | `chat`/`images`/`auto` | ❌ | `auto` | 传输通道 |
| `save_to` | string | ❌ | — | 自定义保存目录 |
| `timeout_ms` | int | ❌ | `RIGHT_CODES_TIMEOUT_MS` | 单次请求超时，单位毫秒 |
| `seed` | int | ❌ | — | 随机种子 |

### list_image_models

列出所有可用模型及其支持的分辨率，无需参数。

### describe_image

使用视觉模型描述图片内容（看图说话）。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `image_url` | string | ✅ | — | 图片 URL |
| `question` | string | ❌ | 描述这张图片的内容 | 提问内容 |
| `model` | enum | ❌ | `gemini-3.1-pro` | 视觉模型 |

## 模型支持

| 模型 | 分辨率 |
|---|---|
| `gpt-image-2-vip` | 1K, 2K, 4K |
| `gpt-image-2`（默认） | 1K |
| `nano-banana` | 1K |
| `nano-banana-2` | 1K, 2K, 4K |
| `nano-banana-pro` | 1K, 2K, 4K |

视觉模型：`gemini-3.1-pro`（默认）、`gemini-3-pro-preview`、`gemini-3.1-pro-preview`。

## 项目结构

```
src/
├── index.ts              # MCP 入口
├── config.ts             # 配置、模型表、尺寸映射
├── tools/
│   ├── generate.ts       # generate_image
│   ├── describe.ts       # describe_image
│   └── models.ts         # list_image_models
├── transport/
│   ├── chat.ts           # chat 流式 (SSE)
│   └── images.ts         # images 同步
└── lib/
    ├── size.ts           # resolution+aspect→size 推导
    ├── extract.ts        # Markdown→URL 提取
    ├── save.ts           # 本地下载
    └── http.ts           # fetch 封装
```

## 开发

```bash
npm install
npm run build    # tsup → dist/index.js
npm run dev      # watch 模式
```

## 故障排查

- **Cloudflare 100s 超时**：默认 `transport=auto` 已经会优先走 chat 流式规避，如果仍然超时，降低 `resolution` 或换更快的模型（`nano-banana`、`nano-banana-2`）
- **Authentication failed**：检查 `RIGHT_CODES_API_KEY` 是否有效；OpenCode 重启后生效
- **图片没有落盘**：检查 `RIGHT_CODES_DOWNLOAD_DIR` 路径是否存在写权限；首次会自动按日期建目录
- **OpenCode 看不到工具**：确认 `command` 路径是绝对路径，且 `dist/index.js` 已经构建成功
