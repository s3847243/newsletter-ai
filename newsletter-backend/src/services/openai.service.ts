import OpenAI from "openai";
import { env } from "../config/env";

const client = new OpenAI({
  apiKey: env.openaiApiKey,
});

export class OpenAIServiceClass {
  private model = env.openaiModel;

  async chat(system: string, messages: { role: "user" | "assistant"; content: string }[]) {
    const response = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        ...messages,
      ],
    });

    const choice = response.choices[0];
    return choice?.message?.content ?? "";
  }

  async simple(system: string, user: string) {
    const response = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return response?.choices[0]?.message?.content ?? "";
  }
}

export const OpenAIService = new OpenAIServiceClass();
