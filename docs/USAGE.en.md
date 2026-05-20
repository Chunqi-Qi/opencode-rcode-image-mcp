# Usage Guide

[← Back to home](../README.en.md) · [中文](USAGE.md) · [English](USAGE.en.md)

Full installation, configuration, tool parameters, and troubleshooting. For a quick overview, see the [project home](../README.en.md).

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Slash Commands](#slash-commands)
- [Usage](#usage)
- [Tools](#tools)
- [Model Support](#model-support)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Installation

Requires Node.js >= 18.

```bash
git clone https://github.com/Chunqi-Qi/opencode-rcode-image-mcp.git ~/code/MCP/opencode-rcode-image-mcp
cd ~/code/MCP/opencode-rcode-image-mcp
npm install
npm run build
```

The build output is `dist/index.js`, which serves as the MCP server entry point.

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `RIGHT_CODES_API_KEY` | Yes | - | Right Code API key (`sk-xxx`) |
| `RIGHT_CODES_BASE_URL` | No | `https://www.right.codes/draw` | API base URL |
| `RIGHT_CODES_DOWNLOAD_DIR` | No | `~/Pictures/right-code` | Root directory for downloaded images |
| `RIGHT_CODES_TIMEOUT_MS` | No | `300000` | Image generation request and download timeout in milliseconds |

### Register With OpenCode

Add the following to `~/.config/opencode/opencode.json`:

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

Replace the path in `command` with your local absolute path.

## Slash Commands

Optional shortcuts. Add them under the `command` field in `opencode.json`:

```jsonc
{
  "command": {
    "draw": {
      "description": "Generate an image",
      "template": "Please use the generate_image tool from the opencode-rcode-image MCP server to generate an image. Parse parameters from the user's input: the first line is the prompt, and optional key=value pairs can override model/resolution/aspect_ratio and other parameters. Defaults: model=gpt-image-2, resolution=1K, aspect_ratio=1:1. After generation, reply with the local image path and online URL only, without extra explanation.\n\nUser input:\n$ARGUMENTS"
    },
    "draw-hd": {
      "description": "High-resolution image generation with 2K + gpt-image-2-vip",
      "template": "Call the generate_image tool to generate an image, forcing model=gpt-image-2-vip and resolution=2K. Prompt: $ARGUMENTS"
    }
  }
}
```

Restart OpenCode for changes to take effect.

## Usage

```
/draw A shiba inu in a spacesuit on the moon, photorealistic
/draw Cyberpunk skyline at night model=nano-banana-2 resolution=2K aspect_ratio=16:9
/draw-hd Neon street in the rain
```

Generated images are automatically saved to `~/Pictures/right-code/yyyy-mm-dd/`.

## Tools

### generate_image

Calls Right Code to generate images. Uses the chat streaming transport by default to avoid Cloudflare timeouts, with automatic fallback to the synchronous images API.

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | string | Yes | - | Image prompt |
| `model` | enum | No | `gpt-image-2` | Image generation model |
| `resolution` | `1K`/`2K`/`4K` | No | `1K` | Resolution tier |
| `size` | string | No | - | Pixel size such as `1024x1024`; overrides resolution+aspect_ratio |
| `aspect_ratio` | `1:1`/`16:9`/... | No | `1:1` | Aspect ratio |
| `n` | int (1-4) | No | 1 | Number of images |
| `image` | string / string[] | No | - | Reference image URL or base64 (image-to-image) |
| `transport` | `chat`/`images`/`auto` | No | `auto` | Transport channel |
| `save_to` | string | No | - | Custom save directory |
| `timeout_ms` | int | No | `RIGHT_CODES_TIMEOUT_MS` | Per-request timeout in milliseconds |
| `seed` | int | No | - | Random seed |

### list_image_models

Lists all available models and their supported resolutions. No parameters.

### describe_image

Describes image content with a vision model.

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `image_url` | string | Yes | - | Image URL |
| `question` | string | No | Describe the content of this image | Question to ask about the image |
| `model` | enum | No | `gemini-3.1-pro` | Vision model |

## Model Support

| Model | Resolutions |
|---|---|
| `gpt-image-2-vip` | 1K, 2K, 4K |
| `gpt-image-2` (default) | 1K |
| `nano-banana` | 1K |
| `nano-banana-2` | 1K, 2K, 4K |
| `nano-banana-pro` | 1K, 2K, 4K |

Vision models: `gemini-3.1-pro` (default), `gemini-3-pro-preview`, `gemini-3.1-pro-preview`.

## Project Structure

```
src/
├── index.ts              # MCP entry point
├── config.ts             # Configuration, model table, size mapping
├── tools/
│   ├── generate.ts       # generate_image
│   ├── describe.ts       # describe_image
│   └── models.ts         # list_image_models
├── transport/
│   ├── chat.ts           # Chat streaming (SSE)
│   └── images.ts         # Synchronous images API
└── lib/
    ├── size.ts           # Derive size from resolution+aspect
    ├── extract.ts        # Extract URL from Markdown
    ├── save.ts           # Local download
    └── http.ts           # fetch wrapper
```

## Development

```bash
npm install
npm run build    # tsup -> dist/index.js
npm run dev      # watch mode
```

## Troubleshooting

- **Cloudflare 100s timeout**: the default `transport=auto` already prefers chat streaming to dodge this. If it still times out, lower the `resolution` or switch to a faster model (`nano-banana`, `nano-banana-2`).
- **Authentication failed**: verify your `RIGHT_CODES_API_KEY`. Restart OpenCode for changes to take effect.
- **Image not saved locally**: check that `RIGHT_CODES_DOWNLOAD_DIR` is writable. The date-based subdirectory is created on first run.
- **OpenCode does not see the tools**: make sure `command` uses an absolute path and `dist/index.js` exists from a successful build.
