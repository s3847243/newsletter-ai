import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth";
import {
  generateDraftSchema,
  rewriteSchema,
  subjectLinesSchema,
  copilotSchema,
} from "../routes/ai.schemas";
import { OpenAIService } from "../services/openai.service";

// 1) Generate full draft
export const generateDraft = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = generateDraftSchema.parse(req.body);

    const wordCount = input.wordCount ?? 800;

    const outlinePart = input.outline && input.outline.length
      ? `Use this outline:\n- ${input.outline.join("\n- ")}`
      : "You can propose a simple structure with an intro, 2–4 sections, and a conclusion.";

    const systemPrompt = `
You are an expert newsletter copywriter.
You write engaging, clear newsletter content in HTML (using basic tags like <p>, <h2>, <ul>, <li>, <strong>).
Do not include <html>, <head> or <body> tags – only the inner content.
Keep it skimmable and easy to read. Avoid huge paragraphs.
`.trim();

    const userPrompt = `
Write a full newsletter issue.

Title: ${input.title}
Audience: ${input.audience || "general online audience"}
Tone: ${input.tone || "conversational, friendly, confident"}
Goal: ${input.goal || "provide value and build trust with readers"}
Target length: about ${wordCount} words.

${outlinePart}

Return ONLY HTML for the body content.
`.trim();

    const html = await OpenAIService.simple(systemPrompt, userPrompt);

    res.json({
      htmlContent: html,
    });
  } catch (err) {
    next(err);
  }
};

// Helper to map rewrite modes to instructions
function modeToInstruction(mode: string): string {
  switch (mode) {
    case "shorten":
      return "Shorten this text while keeping the core meaning and key points. Make it more concise.";
    case "friendlier":
      return "Rewrite this text to sound more friendly, conversational, and warm, but still professional.";
    case "formal":
      return "Rewrite this text to sound more formal and polished, suitable for a professional newsletter.";
    case "fix-grammar":
      return "Fix grammar, spelling, and clarity, but keep the same tone and length as much as possible.";
    case "improve":
    default:
      return "Improve clarity, flow, and impact. You may lightly adjust tone and structure, but keep the meaning.";
  }
}

// 2) Rewrite selected text
export const rewriteText = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = rewriteSchema.parse(req.body);

    const instruction = modeToInstruction(input.mode);

    const systemPrompt = `
You are helping a writer improve parts of their newsletter.
Return ONLY the rewritten text, without commentary or explanation.
`.trim();

    const userPrompt = `
Instruction: ${instruction}

Original text:
"""
${input.text}
"""
`.trim();

    const rewritten = await OpenAIService.simple(systemPrompt, userPrompt);

    res.json({
      rewritten,
    });
  } catch (err) {
    next(err);
  }
};

// 3) Subject lines
export const generateSubjectLines = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = subjectLinesSchema.parse(req.body);
    const count = input.count ?? 5;

    const systemPrompt = `
You are an email marketing expert.
You write short, punchy newsletter subject lines that get opens without sounding spammy.
Return a numbered list of distinct subject lines.
`.trim();

    const userPrompt = `
Write ${count} subject lines for this newsletter.

Title: ${input.title || "Untitled newsletter"}
Summary: ${input.summary || "No summary provided"}
Audience: ${input.audience || "general online audience"}

Each subject line:
- max ~8 words
- no clickbait, no ALL CAPS
- should be slightly curiosity-driven but honest
`.trim();

    const result = await OpenAIService.simple(systemPrompt, userPrompt);

    // Very light parsing: split lines, filter non-empty.
    const lines = result
      .split("\n")
      .map((l) => l.replace(/^\s*\d+[\).]\s*/, "").trim())
      .filter((l) => l.length > 0);

    res.json({
      subjectLines: lines,
      raw: result,
    });
  } catch (err) {
    next(err);
  }
};

// 4) Copilot chat
export const copilotChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = copilotSchema.parse(req.body);

    const ctx = input.context || {};

    const systemParts = [
      "You are an AI newsletter copilot embedded inside a writing app.",
      "You help with structure, clarity, tone, hooks, CTAs, and editing.",
      "You can propose improvements or new sections, but avoid rewriting entire newsletters unless asked.",
      ctx.title ? `Current newsletter title: ${ctx.title}` : "",
      ctx.audience ? `Target audience: ${ctx.audience}` : "",
      ctx.tone ? `Preferred tone: ${ctx.tone}` : "",
      ctx.currentContent
        ? "The user has existing content; you can reference it, but do not just repeat it."
        : "",
      "Keep responses practical and concise. Where relevant, suggest concrete wording, not just abstract advice.",
    ].filter(Boolean);

    const systemPrompt = systemParts.join("\n");

    const messages = input.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })) as { role: "user" | "assistant"; content: string }[];

    const reply = await OpenAIService.chat(systemPrompt, messages);

    res.json({
      reply,
    });
  } catch (err) {
    next(err);
  }
};


