# opencode-rcode-image-mcp

[中文](README.md) | [English](README.en.md)

An MCP server that generates images with models such as gpt-image-2 and nano-banana through Right Code's OpenAI-compatible API. It supports both chat streaming and synchronous images transports, automatically falls back when needed, and downloads generated images locally.

## Installation

```bash
git clone <repo-url> ~/code/MCP/opencode-rcode-image-mcp
cd ~/code/MCP/opencode-rcode-image-mcp
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `RIGHT_CODES_API_KEY` | Yes | - | Right Code API key (`sk-xxx`) |
| `RIGHT_CODES_BASE_URL` | No | `https://www.right.codes/draw` | API base URL |
| `RIGHT_CODES_DOWNLOAD_DIR` | No | `~/Pictures/right-code` | Root directory for downloaded images |

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
        "RIGHT_CODES_DOWNLOAD_DIR": "~/Pictures/right-code"
      }
    }
  }
}
```

### Slash Commands (Optional)

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

Restart OpenCode after updating the configuration.

## Usage

```
/draw A Shiba Inu wearing a spacesuit standing on the moon, realistic style
/draw Cyberpunk city at night model=nano-banana-2 resolution=2K aspect_ratio=16:9
/draw-hd Neon street in the rain
```

Generated images are automatically saved to `~/Pictures/right-code/yyyy-mm-dd/`.

## Tools

### generate_image

Calls Right Code to generate images. By default, it uses the chat streaming transport to avoid Cloudflare timeouts and automatically falls back to the synchronous images API if needed.

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| prompt | string | Yes | - | Image prompt |
| model | enum | No | gpt-image-2 | Image generation model |
| resolution | 1K/2K/4K | No | 1K | Resolution tier |
| size | string | No | - | Pixel size such as 1024x1024; overrides resolution+aspect_ratio |
| aspect_ratio | 1:1/16:9/... | No | 1:1 | Aspect ratio |
| n | int (1-4) | No | 1 | Number of images to generate |
| image | string/string[] | No | - | Reference image URL or base64 data |
| transport | chat/images/auto | No | auto | Transport channel |
| save_to | string | No | - | Custom save directory |
| seed | int | No | - | Random seed |

### list_image_models

Lists all available models and their supported resolutions.

### describe_image

Describes image content with a vision model.

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| image_url | string | Yes | - | Image URL |
| question | string | No | Describe the content of this image | Question to ask about the image |
| model | enum | No | gemini-3.1-pro | Vision model |

## Model Support

| Model | Resolutions |
|---|---|
| gpt-image-2-vip | 1K, 2K, 4K |
| gpt-image-2 (default) | 1K |
| nano-banana | 1K |
| nano-banana-2 | 1K, 2K, 4K |
| nano-banana-pro | 1K, 2K, 4K |

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

## License

MIT
