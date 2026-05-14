<div align="center">

# opencode-rcode-image-mcp

**One-line image generation right inside your OpenCode terminal**

[中文](README.md) · [English](README.en.md) · [Full Usage Guide](docs/USAGE.en.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-orange.svg)](https://modelcontextprotocol.io)
[![Models](https://img.shields.io/badge/models-gpt--image--2%20%7C%20nano--banana-purple.svg)](#supported-models)

</div>

---

An MCP server that brings top-tier image models — `gpt-image-2` and the `nano-banana` family — into [OpenCode](https://opencode.ai) and other MCP clients via [Right Code](https://www.right.codes)'s OpenAI-compatible API. Type `/draw a shiba in a spacesuit` in your terminal, and the image lands in `~/Pictures/` seconds later.

## Highlights

- **Multi-model in one place** — switch between five image models with a single config, from fast previews to 4K renders
- **Multi-resolution** — 1K / 2K / 4K with preset 1:1, 16:9, 9:16, 4:3, 3:4 aspect ratios
- **Dual transport, timeout-proof** — chat streaming by default to dodge Cloudflare's 100s limit, with automatic fallback to the synchronous images API
- **Auto-saved locally** — every result lands in `~/Pictures/right-code/yyyy-mm-dd/`, organized by date
- **Vision built-in** — `describe_image` taps Gemini 3 Pro and friends to read images back
- **Drop-in setup** — `npm install` plus a JSON snippet. Works with OpenCode and Claude Desktop out of the box

## Demo

```
/draw A shiba inu in a spacesuit on the moon, photorealistic
/draw Cyberpunk skyline at night model=nano-banana-2 resolution=2K aspect_ratio=16:9
/draw-hd Neon street in the rain
```

Example response:

```
Saved: ~/Pictures/right-code/2026-05-14/shiba-astronaut.png
URL:   https://cdn.right.codes/...
```

## Supported Models

| Model | Resolutions | Best for |
|---|---|---|
| `gpt-image-2-vip` | 1K · 2K · 4K | High-res output, posters, detail-heavy work |
| `gpt-image-2` (default) | 1K | Fast iteration, everyday creation |
| `nano-banana` | 1K | Lightning-fast previews |
| `nano-banana-2` | 1K · 2K · 4K | Speed-quality balance |
| `nano-banana-pro` | 1K · 2K · 4K | Advanced quality, strong prompt understanding |

Vision: `describe_image` defaults to `gemini-3.1-pro`, switchable to `gemini-3-pro-preview` and `gemini-3.1-pro-preview`.

## Quick Start

```bash
git clone https://github.com/Chunqi-Qi/opencode-rcode-image-mcp.git
cd opencode-rcode-image-mcp
npm install && npm run build
```

Add to `~/.config/opencode/opencode.json`:

```jsonc
{
  "mcp": {
    "opencode-rcode-image": {
      "type": "local",
      "command": ["node", "/absolute/path/opencode-rcode-image-mcp/dist/index.js"],
      "enabled": true,
      "environment": {
        "RIGHT_CODES_API_KEY": "sk-xxx"
      }
    }
  }
}
```

Restart OpenCode and you're set. Full install, slash commands, parameters and troubleshooting are in the **[Usage Guide](docs/USAGE.en.md)**.

## Tools

| Tool | What it does |
|---|---|
| `generate_image` | Text-to-image and image-to-image across all supported models and resolutions |
| `list_image_models` | List every available model with its supported resolutions |
| `describe_image` | Run a vision model over an image and get a description |

See [Usage · Tools](docs/USAGE.en.md#tools) for full parameters and examples.

## Documentation

- [Usage Guide](docs/USAGE.en.md) — install, config, parameters, development
- [中文 README](README.md)
- [中文使用文档](docs/USAGE.md)

## License

MIT © Chunqi-Qi
