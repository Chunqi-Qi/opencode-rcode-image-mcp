import { config } from "../config.js";
import { HttpError, fetchJson } from "../lib/http.js";

export interface GenerateParams {
  model: string;
  prompt: string;
  size: string;
  n?: number;
  image?: string[];
  response_format?: "url" | "b64_json";
  timeout_ms?: number;
  seed?: number;
}

export interface ImageData {
  url?: string;
  b64_json?: string;
  local_path?: string;
  mime_type?: string;
}

export interface GenerateResult {
  success: boolean;
  model: string;
  transport_used: "images";
  size: string;
  images: ImageData[];
  usage?: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
  };
  error?: string;
}

export async function generateViaImages(params: GenerateParams): Promise<GenerateResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeout_ms ?? 180_000);

  try {
    const body: Record<string, unknown> = {
      model: params.model,
      prompt: params.prompt,
      size: params.size,
      n: params.n ?? 1,
      response_format: params.response_format ?? "url",
    };

    if (params.image && params.image.length > 0) {
      body.image = params.image.length === 1 ? params.image[0] : params.image;
    }

    if (params.seed !== undefined) {
      body.seed = params.seed;
    }

    const data = await fetchJson(config.IMAGES_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const images: ImageData[] = (data.data ?? []).map((item: Record<string, unknown>) => ({
      url: item.url as string | undefined,
      b64_json: item.b64_json as string | undefined,
    }));

    return {
      success: true,
      model: params.model,
      transport_used: "images",
      size: params.size,
      images,
      usage: data.usage
        ? {
            total_tokens: data.usage.total_tokens as number,
            input_tokens: data.usage.input_tokens as number,
            output_tokens: data.usage.output_tokens as number,
          }
        : undefined,
    };
  } catch (err) {
    if (err instanceof HttpError) {
      return {
        success: false,
        model: params.model,
        transport_used: "images",
        size: params.size,
        images: [],
        error: `HTTP ${err.status}: ${err.body}`,
      };
    }
    return {
      success: false,
      model: params.model,
      transport_used: "images",
      size: params.size,
      images: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  } finally {
    clearTimeout(timeout);
  }
}
