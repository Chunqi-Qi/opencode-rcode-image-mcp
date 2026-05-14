#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generate } from "./tools/generate.js";
import { describe } from "./tools/describe.js";
import { listModels } from "./tools/models.js";

const server = new McpServer({
  name: "opencode-rcode-image",
  version: "1.0.0",
});

server.registerTool(
  "generate_image",
  {
    description:
      "通过 Right Code 调用 gpt-image-2 / nano-banana 等模型生成图片。支持 chat 流式（默认）和 images 同步两种通道，自动回退。生成后自动下载到本地。",
    inputSchema: {
      prompt: z.string().describe("图片描述提示词"),
      model: z
        .enum(["gpt-image-2-vip", "gpt-image-2", "nano-banana", "nano-banana-2", "nano-banana-pro"])
        .default("gpt-image-2")
        .describe("生图模型：gpt-image-2-vip(1K/2K/4K), gpt-image-2(仅1K), nano-banana(仅1K), nano-banana-2(1K/2K/4K), nano-banana-pro(1K/2K/4K)"),
      resolution: z
        .enum(["1K", "2K", "4K"])
        .default("1K")
        .describe("分辨率档位"),
      size: z
        .string()
        .describe("直接指定像素尺寸，如 1024x1024，覆盖 resolution+aspect_ratio")
        .optional(),
      aspect_ratio: z
        .enum(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"])
        .default("1:1")
        .describe("宽高比"),
      n: z
        .number()
        .int()
        .min(1)
        .max(4)
        .default(1)
        .describe("生成数量"),
      image: z
        .union([z.string(), z.array(z.string())])
        .describe("参考图 URL 或 base64，可传单张或多张")
        .optional(),
      transport: z
        .enum(["chat", "images", "auto"])
        .default("auto")
        .describe("通道：auto 优先 chat 流式防超时，失败回退 images"),
      save_to: z
        .string()
        .describe("自定义保存目录（绝对路径）")
        .optional(),
      seed: z
        .number()
        .int()
        .describe("随机种子")
        .optional(),
    },
  },
  async (input) => {
    const result = await generate(input as Parameters<typeof generate>[0]);

    const imagesForText = result.images.map(({ buffer, ...rest }) => rest);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ...result, images: imagesForText }, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "list_image_models",
  {
    description: "列出所有可用的生图模型及其支持的分辨率",
    inputSchema: {},
  },
  async () => {
    const models = listModels();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(models, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "describe_image",
  {
    description: "使用视觉模型描述图片内容（看图说话）",
    inputSchema: {
      image_url: z.string().describe("图片 URL"),
      question: z
        .string()
        .default("描述这张图片的内容")
        .describe("针对图片的提问"),
      model: z
        .enum(["gemini-3-pro-preview", "gemini-3.1-pro", "gemini-3.1-pro-preview"])
        .default("gemini-3.1-pro")
        .describe("视觉模型"),
    },
  },
  async (input) => {
    const result = await describe(input as Parameters<typeof describe>[0]);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
