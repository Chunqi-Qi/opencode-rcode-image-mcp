import { resolve, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";

const BASE_URL = process.env["RIGHT_CODES_BASE_URL"] ?? "https://www.right.codes/draw";
const API_KEY = process.env["RIGHT_CODES_API_KEY"] ?? "";
const TIMEOUT_ENV = Number(process.env["RIGHT_CODES_TIMEOUT_MS"] ?? 300_000);
const REQUEST_TIMEOUT_MS = Number.isFinite(TIMEOUT_ENV) && TIMEOUT_ENV > 0 ? TIMEOUT_ENV : 300_000;
const DEFAULT_DOWNLOAD = join(homedir(), "Pictures", "right-code");
const DOWNLOAD_DIR = process.env["RIGHT_CODES_DOWNLOAD_DIR"]
  ? process.env["RIGHT_CODES_DOWNLOAD_DIR"].startsWith("~/")
    ? join(homedir(), process.env["RIGHT_CODES_DOWNLOAD_DIR"].slice(2))
    : resolve(process.env["RIGHT_CODES_DOWNLOAD_DIR"])
  : DEFAULT_DOWNLOAD;

function ensureDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

ensureDir(DOWNLOAD_DIR);

export const config = {
  BASE_URL,
  API_KEY,
  DOWNLOAD_DIR,
  REQUEST_TIMEOUT_MS,

  CHAT_ENDPOINT: `${BASE_URL}/v1/chat/completions`,
  IMAGES_ENDPOINT: `${BASE_URL}/v1/images/generations`,

  DEFAULT_MODEL: "gpt-image-2",
  DEFAULT_SIZE: "1024x1024",

  CHAT_READ_MODEL: "gemini-3.1-pro",

  MODELS: {
    "gpt-image-2-vip": {
      name: "GPT Image 2 VIP",
      resolutions: ["1K", "2K", "4K"],
    },
    "gpt-image-2": {
      name: "GPT Image 2",
      resolutions: ["1K"],
    },
    "nano-banana": {
      name: "Nano Banana",
      resolutions: ["1K"],
    },
    "nano-banana-2": {
      name: "Nano Banana 2",
      resolutions: ["1K", "2K", "4K"],
    },
    "nano-banana-pro": {
      name: "Nano Banana Pro",
      resolutions: ["1K", "2K", "4K"],
    },
  } as const,

  SYSTEM_PROMPT:
    "你是一个图片生成助手。用户要求生成图片时，请直接生成并返回图片链接。不要额外解释，只输出图片的 Markdown 格式：![image](URL)",
} as const;

export type ModelName = keyof typeof config.MODELS;
export type ResponseFormat = "url" | "b64_json";
