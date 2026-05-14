import type { AspectRatio, Resolution } from "../config.js";
import { config } from "../config.js";

export interface SizeResult {
  size: string;
  warning?: string;
}

export function deriveSize(
  resolution: Resolution,
  aspect_ratio: AspectRatio,
  model: string,
): SizeResult {
  const basePixels = config.RESOLUTION_PIXELS[resolution];
  const ratio = config.ASPECT_RATIOS[aspect_ratio];

  if (!basePixels || !ratio) {
    return { size: config.DEFAULT_SIZE, warning: `invalid resolution/aspect, fallback to ${config.DEFAULT_SIZE}` };
  }

  const modelInfo = config.MODELS[model as keyof typeof config.MODELS];
  if (modelInfo && !modelInfo.resolutions.includes(resolution)) {
    const fallbackResolution = modelInfo.resolutions[0];
    if (!fallbackResolution) {
      return { size: config.DEFAULT_SIZE, warning: `model ${model} has no resolutions, fallback to ${config.DEFAULT_SIZE}` };
    }
    const fallbackPixels = config.RESOLUTION_PIXELS[fallbackResolution];
    if (!fallbackPixels) return { size: config.DEFAULT_SIZE };

    const w = Math.round(fallbackPixels * ratio.width);
    const h = Math.round(fallbackPixels * ratio.height);
    return {
      size: `${w}x${h}`,
      warning: `model ${model} does not support ${resolution}, downgraded to ${fallbackResolution}`,
    };
  }

  const w = Math.round(basePixels * ratio.width);
  const h = Math.round(basePixels * ratio.height);
  return { size: `${w}x${h}` };
}
