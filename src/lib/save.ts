import { join, resolve } from "node:path";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { config } from "../config.js";

export interface SaveResult {
  local_path: string;
  mime_type: string;
  buffer: Buffer;
}

export async function saveImage(url: string, saveTo?: string): Promise<SaveResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "image/png";
    const ext = contentType.split("/")[1] ?? "png";
    const mime_type = contentType;

    const today = new Date();
    const dateDir = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const saveDir = saveTo
      ? resolve(saveTo.startsWith("~/") ? join(homedir(), saveTo.slice(2)) : saveTo)
      : resolve(config.DOWNLOAD_DIR, dateDir);
    if (!existsSync(saveDir)) {
      mkdirSync(saveDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `img_${timestamp}.${ext}`;
    const local_path = join(saveDir, filename);

    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(local_path, buffer);

    return { local_path, mime_type, buffer };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
