<div align="center">

# opencode-rcode-image-mcp

**OpenCode 终端里的一句话生图工具**

[中文](README.md) · [English](README.en.md) · [完整使用文档](docs/USAGE.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-orange.svg)](https://modelcontextprotocol.io)
[![Models](https://img.shields.io/badge/models-gpt--image--2%20%7C%20nano--banana-purple.svg)](#支持模型)

<img src="assets/opencode-rcode-image-mcp-hero.png" alt="opencode-rcode-image-mcp project introduction" width="100%" />

</div>

---

通过 [Right Code](https://www.right.codes) 的 OpenAI 兼容 API，把 `gpt-image-2` / `nano-banana` 系列顶级生图模型接入 [OpenCode](https://opencode.ai) 等 MCP 客户端。在终端写一句 `/draw 一只穿宇航服的柴犬`，几秒后图片自动落盘到 `~/Pictures/`。

## 核心特性

- **多模型一站式**：一套配置切换 5 个生图模型，从极速预览到 4K 高清
- **多分辨率**：1K / 2K / 4K，预设 1:1、16:9、9:16、4:3、3:4 等常用比例
- **双通道防超时**：默认 chat 流式避开 Cloudflare 100s 限制，失败自动回退 images 同步
- **自动落盘**：生成结果自动保存到 `~/Pictures/right-code/yyyy-mm-dd/`，按日期归档
- **看图说话**：内置 `describe_image` 工具，调 Gemini 3 Pro 等视觉模型理解图片
- **零门槛接入**：`npm install` + 一段 JSON 配置，OpenCode / Claude Desktop 即插即用

## 演示

```
/draw 一只穿宇航服的柴犬站在月球表面，写实风格
/draw 赛博朋克城市夜景 model=nano-banana-2 resolution=2K aspect_ratio=16:9
/draw-hd 雨中霓虹街道
```

返回示例：

```
已保存：~/Pictures/right-code/2026-05-14/shiba-astronaut.png
URL：https://cdn.right.codes/...
```

## 支持模型

| 模型 | 分辨率 | 适用场景 |
|---|---|---|
| `gpt-image-2-vip` | 1K · 2K · 4K | 高清出图、商业海报、细节优先 |
| `gpt-image-2`（默认） | 1K | 快速迭代、日常创作 |
| `nano-banana` | 1K | 极速预览，秒级响应 |
| `nano-banana-2` | 1K · 2K · 4K | 速度与画质平衡 |
| `nano-banana-pro` | 1K · 2K · 4K | 进阶画质，强语义理解 |

视觉理解：`describe_image` 默认使用 `gemini-3.1-pro`，可切换 `gemini-3-pro-preview`、`gemini-3.1-pro-preview`。

## 快速开始

```bash
git clone https://github.com/Chunqi-Qi/opencode-rcode-image-mcp.git
cd opencode-rcode-image-mcp
npm install && npm run build
```

在 `~/.config/opencode/opencode.json` 加上：

```jsonc
{
  "mcp": {
    "opencode-rcode-image": {
      "type": "local",
      "command": ["node", "/绝对路径/opencode-rcode-image-mcp/dist/index.js"],
      "enabled": true,
      "environment": {
        "RIGHT_CODES_API_KEY": "sk-xxx"
      }
    }
  }
}
```

重启 OpenCode 即可使用。完整安装、Slash Command、参数、故障排查见 **[使用文档](docs/USAGE.md)**。

## 工具一览

| 工具 | 作用 |
|---|---|
| `generate_image` | 文生图 / 图生图，多模型多分辨率 |
| `list_image_models` | 列出全部可用模型与支持分辨率 |
| `describe_image` | 调用视觉模型描述图片内容 |

详细参数与示例见 [使用文档 · 工具](docs/USAGE.md#工具)。

## 文档

- [使用文档](docs/USAGE.md) — 安装、配置、参数、开发
- [English README](README.en.md)
- [English Usage](docs/USAGE.en.md)

## License

MIT © Chunqi-Qi
