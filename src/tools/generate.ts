import { z } from "zod";
import { config } from "../config.js";
import { saveImage } from "../lib/save.js";
import { generateViaChat } from "../transport/chat.js";
import { generateViaImages } from "../transport/images.js";
import type { ModelName } from "../config.js";

export const schema = z.object({
  prompt: z.string().describe("图片描述提示词"),
  model: z
    .enum(["gpt-image-2-vip", "gpt-image-2", "nano-banana", "nano-banana-2", "nano-banana-pro"])
    .default("gpt-image-2")
    .describe("生图模型"),
  size: z
    .string()
    .regex(/^\d{3,5}x\d{3,5}$/)
    .optional()
    .describe("直接指定像素尺寸，如 1024x1024"),
  image: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("参考图 URL 或 base64"),
  response_format: z
    .enum(["url", "b64_json"])
    .default("url")
    .describe("返回格式"),
});

type Input = z.infer<typeof schema>;

export async function generate(input: Input) {
  const model = input.model as ModelName;
  const imageArr = input.image
    ? Array.isArray(input.image)
      ? input.image
      : [input.image]
    : undefined;

  const size = input.size ?? config.DEFAULT_SIZE;
  const warnings: string[] = [];

  const images: Array<{
    url?: string;
    b64_json?: string;
    local_path?: string;
    mime_type?: string;
    file_name?: string;
    buffer?: Buffer;
  }> = [];
  let transportUsed: "chat" | "images" | "auto" = "auto";
  let usageResult: GenerateResult["usage"];
  let errorResult: string | undefined;
  let rawText: string | undefined;

  const result = await generateViaChat({
    model,
    prompt: input.prompt,
    size,
    image: imageArr,
  });

  transportUsed = "chat";
  rawText = result.raw_text;

  if (result.success && result.images.length > 0) {
    for (const img of result.images) {
      if (img.url) {
        const saved = await saveImage(img.url);
        images.push({
          url: img.url,
          local_path: saved?.local_path,
          mime_type: saved?.mime_type,
          buffer: saved?.buffer,
        });
      }
    }
    if (result.usage) usageResult = result.usage;
  } else {
    warnings.push(`chat failed: ${result.error}, falling back to images`);
    const fallback = await generateViaImages({
      model,
      prompt: input.prompt,
      size,
      image: imageArr,
      response_format: input.response_format as "url" | "b64_json",
    });

    transportUsed = "images";
    if (fallback.success && fallback.images.length > 0) {
      for (const img of fallback.images) {
        const url = img.url ?? img.b64_json;
        if (url) {
          const saved = url.startsWith("http") ? await saveImage(url) : null;
          images.push({
            url: img.url,
            b64_json: img.b64_json,
            local_path: saved?.local_path,
            mime_type: saved?.mime_type,
            buffer: saved?.buffer,
          });
        }
      }
      if (fallback.usage) usageResult = fallback.usage;
    } else {
      errorResult = fallback.error ?? "images fallback also failed";
    }
  }

  return {
    success: images.length > 0,
    model,
    transport_used: transportUsed,
    size,
    images,
    usage: usageResult,
    warnings: warnings.length > 0 ? warnings : undefined,
    error: errorResult,
    raw_text: rawText,
  };
}

type GenerateResult = {
  usage?: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
  };
};
