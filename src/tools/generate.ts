import { z } from "zod";
import { config } from "../config.js";
import { deriveSize } from "../lib/size.js";
import { saveImage } from "../lib/save.js";
import { generateViaChat } from "../transport/chat.js";
import { generateViaImages } from "../transport/images.js";
import type { ModelName, AspectRatio, Resolution, Transport } from "../config.js";

export const schema = z.object({
  prompt: z.string().describe("图片描述提示词"),
  model: z
    .enum(["gpt-image-2-vip", "gpt-image-2", "nano-banana", "nano-banana-2", "nano-banana-pro"])
    .default("gpt-image-2")
    .describe("生图模型"),
  resolution: z
    .enum(["1K", "2K", "4K"])
    .default("1K")
    .describe("分辨率档位，映射到像素尺寸"),
  size: z
    .string()
    .regex(/^\d{3,5}x\d{3,5}$/)
    .optional()
    .describe("直接指定像素尺寸，覆盖 resolution 和 aspect_ratio"),
  aspect_ratio: z
    .enum(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"])
    .default("1:1")
    .describe("宽高比，size 未填写时与 resolution 联合推导"),
  n: z
    .number()
    .int()
    .min(1)
    .max(4)
    .default(1)
    .describe("生成数量"),
  image: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("参考图 URL 或 base64"),
  transport: z
    .enum(["chat", "images", "auto"])
    .default("auto")
    .describe("auto 优先走 chat 流式，失败回退 images"),
  response_format: z
    .enum(["url", "b64_json"])
    .default("url")
    .describe("返回格式"),
  save_to: z
    .string()
    .optional()
    .describe("可选，保存图片到指定本地目录"),
  timeout_ms: z
    .number()
    .int()
    .positive()
    .default(config.REQUEST_TIMEOUT_MS)
    .describe("整体超时毫秒"),
  seed: z
    .number()
    .int()
    .optional()
    .describe("随机种子 (部分模型支持)"),
});

type Input = z.infer<typeof schema>;

export async function generate(input: Input) {
  const model = input.model as ModelName;
  const imageArr = input.image
    ? Array.isArray(input.image)
      ? input.image
      : [input.image]
    : undefined;

  const sizeResult = input.size
    ? { size: input.size }
    : deriveSize(input.resolution as Resolution, input.aspect_ratio as AspectRatio, model);

  const size = sizeResult.size;
  const warnings: string[] = sizeResult.warning ? [sizeResult.warning] : [];

  const images: Array<{
    url?: string;
    b64_json?: string;
    local_path?: string;
    mime_type?: string;
    file_name?: string;
    buffer?: Buffer;
  }> = [];
  let transportUsed: Transport = "auto";
  let usageResult: GenerateResult["usage"];
  let errorResult: string | undefined;
  let rawText: string | undefined;

  const targetCount = input.n ?? 1;

  for (let i = 0; i < targetCount; i++) {
    const shouldChat =
      input.transport === "chat" ||
      input.transport === "auto";

    if (shouldChat) {
      const result = await generateViaChat({
        model,
        prompt: input.prompt,
        size,
        image: imageArr,
        timeout_ms: input.timeout_ms,
        seed: input.seed,
      });

      transportUsed = "chat";
      rawText = result.raw_text;

      if (result.success && result.images.length > 0) {
        for (const img of result.images) {
          if (img.url) {
            const saved = await saveImage(img.url, input.save_to);
            images.push({
              url: img.url,
              local_path: saved?.local_path,
              mime_type: saved?.mime_type,
              buffer: saved?.buffer,
            });
          }
        }
        if (result.usage) usageResult = result.usage;
        if (images.length >= targetCount) break;
        continue;
      }

      const chatFailed = result.error;
      if (input.transport === "auto") {
        warnings.push(`chat failed: ${chatFailed}, falling back to images`);
        const fallback = await generateViaImages({
          model,
          prompt: input.prompt,
          size,
          n: Math.max(1, targetCount - images.length),
          image: imageArr,
          response_format: input.response_format as "url" | "b64_json",
          timeout_ms: input.timeout_ms,
          seed: input.seed,
        });

        transportUsed = "images";
        if (fallback.success && fallback.images.length > 0) {
          for (const img of fallback.images) {
            const url = img.url ?? img.b64_json;
            if (url) {
              const saved = url.startsWith("http") ? await saveImage(url, input.save_to) : null;
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
          break;
        }

        errorResult = fallback.error ?? "images fallback also failed";
      } else {
        errorResult = result.error ?? "chat mode failed";
      }
    } else {
      const result = await generateViaImages({
        model,
        prompt: input.prompt,
        size,
        n: Math.max(1, targetCount - images.length),
        image: imageArr,
        response_format: input.response_format as "url" | "b64_json",
        timeout_ms: input.timeout_ms,
        seed: input.seed,
      });

      transportUsed = "images";
      if (result.success && result.images.length > 0) {
        for (const img of result.images) {
          const url = img.url ?? img.b64_json;
          if (url) {
            const saved = url.startsWith("http") ? await saveImage(url, input.save_to) : null;
            images.push({
              url: img.url,
              b64_json: img.b64_json,
              local_path: saved?.local_path,
              mime_type: saved?.mime_type,
              buffer: saved?.buffer,
            });
          }
        }
        if (result.usage) usageResult = result.usage;
        break;
      }

      errorResult = result.error ?? "images mode failed";
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
