import { config } from "../config.js";

export function listModels() {
  return Object.entries(config.MODELS).map(([id, info]) => ({
    id,
    name: info.name,
    resolutions: info.resolutions,
  }));
}
