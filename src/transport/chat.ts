import { config } from "../config.js";
import { extractImageUrls } from "../lib/extract.js";
import { HttpError } from "../lib/http.js";

export interface GenerateResult {
  success: boolean;
  model: string;
  transport_used: "chat";
  size: string;
  images: Array<{ url: string }>;
  raw_text: string;
  usage?: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
  };
  error?: string;
}

export interface ChatParams {
  model: string;
  prompt: string;
  size: string;
  image?: string[];
  timeout_ms?: number;
}

export async function generateViaChat(params: ChatParams): Promise<GenerateResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeout_ms ?? config.REQUEST_TIMEOUT_MS);

  try {
    const userContent = buildPromptContent(params.prompt, params.size, params.image);

    const body: Record<string, unknown> = {
      model: params.model,
      stream: true,
      messages: [
        { role: "system", content: config.SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    };

    const res = await fetch(config.CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new HttpError(`HTTP ${res.status}`, res.status, text);
    }

    let fullText = "";
    let usage: GenerateResult["usage"];

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") continue;

        try {
          const chunk = JSON.parse(dataStr);
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            fullText += delta.content;
          }
          if (chunk.usage) {
            usage = {
              total_tokens: chunk.usage.total_tokens as number,
              input_tokens: chunk.usage.prompt_tokens as number,
              output_tokens: chunk.usage.completion_tokens as number,
            };
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    const urls = extractImageUrls(fullText);
    const images = urls.map((url) => ({ url }));

    if (images.length === 0 && fullText) {
      const fallbackUrls = extractImageUrls(fullText);
      if (fallbackUrls.length > 0) {
        images.push(...fallbackUrls.map((url) => ({ url })));
      }
    }

    return {
      success: images.length > 0,
      model: params.model,
      transport_used: "chat",
      size: params.size,
      images,
      raw_text: fullText,
      usage,
      error: images.length === 0 ? "no image URL found in chat response" : undefined,
    };
  } catch (err) {
    if (err instanceof HttpError) {
      return {
        success: false,
        model: params.model,
        transport_used: "chat",
        size: params.size,
        images: [],
        raw_text: "",
        error: `HTTP ${err.status}: ${err.body}`,
      };
    }
    return {
      success: false,
      model: params.model,
      transport_used: "chat",
      size: params.size,
      images: [],
      raw_text: "",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildPromptContent(
  prompt: string,
  size: string,
  imageUrls?: string[],
): string | Array<Record<string, unknown>> {
  if (!imageUrls || imageUrls.length === 0) {
    return `请生成一张图片，分辨率 ${size}。提示词：${prompt}`;
  }

  const content: Array<Record<string, unknown>> = [
    { type: "text", text: `请参考提供的图片，生成一张新图片，分辨率 ${size}。提示词：${prompt}` },
  ];

  for (const url of imageUrls) {
    content.push({
      type: "image_url",
      image_url: { url },
    });
  }

  return content;
}
