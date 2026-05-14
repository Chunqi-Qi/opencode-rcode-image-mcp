import { z } from "zod";
import { config } from "../config.js";

export const schema = z.object({
  image_url: z.string().describe("图片 URL"),
  question: z
    .string()
    .default("描述这张图片的内容")
    .describe("针对图片的提问"),
  model: z
    .enum(["gemini-3-pro-preview", "gemini-3.1-pro", "gemini-3.1-pro-preview"])
    .default("gemini-3.1-pro")
    .describe("视觉模型"),
});

type Input = z.infer<typeof schema>;

export async function describe(input: Input) {
  const body = {
    model: input.model,
    stream: false,
    messages: [
      {
        role: "user" as const,
        content: [
          { type: "text", text: input.question },
          { type: "image_url", image_url: { url: input.image_url } },
        ],
      },
    ],
  };

  const res = await fetch(config.CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    success: res.ok,
    question: input.question,
    answer: content,
    usage: data.usage,
  };
}
