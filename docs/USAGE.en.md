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
      "template": "Please use the generate_image tool from the opencode-rcode-image MCP server to generate an image. Treat all non key=value text as the prompt. Recognize only these optional key=value parameters: model, size, image, response_format. After generation, reply with the local image path and online URL only, without extra explanation.\n\nUser input:\n$ARGUMENTS"
    },
    "draw-hd": {
      "description": "High-resolution image generation with gpt-image-2-vip",
      "template": "Please use the generate_image tool from the opencode-rcode-image MCP server to generate a high-resolution image. Fixed parameter: model=gpt-image-2-vip. Treat all non key=value text as the prompt. Recognize only these optional key=value parameters: size, image, response_format, and ignore model from user input. After generation, reply with the local image path and online URL only, without extra explanation.\n\nUser input:\n$ARGUMENTS"
    }
  }
}
```

Restart OpenCode for changes to take effect.

## Usage

```
/draw A shiba inu in a spacesuit on the moon, photorealistic
/draw Cyberpunk skyline at night model=nano-banana-2 size=2048x1152
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
| `size` | string | No | `1024x1024` | Pixel size such as `1024x1024` |
| `image` | string / string[] | No | - | Reference image URL or base64 (image-to-image) |
| `response_format` | `url`/`b64_json` | No | `url` | Response format |

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

- **Cloudflare 100s timeout**: the tool prefers chat streaming by default and automatically falls back to the images endpoint. If it still times out, lower `size` or switch to a faster model (`nano-banana`, `nano-banana-2`).
- **Authentication failed**: verify your `RIGHT_CODES_API_KEY`. Restart OpenCode for changes to take effect.
- **Image not saved locally**: check that `RIGHT_CODES_DOWNLOAD_DIR` is writable. The date-based subdirectory is created on first run.
- **OpenCode does not see the tools**: make sure `command` uses an absolute path and `dist/index.js` exists from a successful build.
