import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth";
import {
  generateDraftSchema,
  rewriteSchema,
  subjectLinesSchema,
  copilotSchema,
} from "../routes/ai.schemas";
import { OpenAIService } from "../services/openai.service";
import {prisma} from "../lib/prisma"
const BASE_SYSTEM_PROMPT = `
  You are an expert newsletter and article writing assistant.

  You help creators write:
  - engaging newsletter issues
  - personal stories
  - educational articles

  WRITING PRINCIPLES:
  - Start with a clear, concrete HOOK in the first 1–2 sentences.
  - Use simple, conversational language (no corporate jargon).
  - Prefer short paragraphs (1–3 sentences).
  - Use specific examples and details, not vague statements.
  - Keep one main idea per section.
  - Use headings and bullet points where it helps clarity.
  - For newsletters, end with a clear takeaway or simple call-to-action.

  STYLE:
  - Default tone: warm, confident, and helpful.
  - Avoid sounding like a generic AI assistant.
  - Do not say "As an AI" or comment on being artificial.

  FORMATTING:
  - Respond in clean Markdown or HTML that can be converted for the editor.
  - No surrounding backticks unless explicitly requested.
`.trim();

export const generateDraft = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = generateDraftSchema.parse(req.body);

    const wordCount = input.wordCount ?? 800;

    const outlinePart =
      input.outline && input.outline.length
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

export const copilotChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = copilotSchema.parse(req.body);
    const ctx = input.context || {};
    const authUserId = req.user?.id;

    let creatorId: string | undefined;
    let niche: string | undefined;

    if (authUserId) {
      const creator = await prisma.creatorProfile.findFirst({
        where: { userId: authUserId },
        select: { id: true, niche: true },
      });
      creatorId = creator?.id;
      niche = creator?.niche || undefined;
    }

    const systemParts = [
      BASE_SYSTEM_PROMPT,
      "",
      "You are an AI newsletter copilot embedded inside a writing app.",
      "You help with structure, clarity, tone, hooks, CTAs, and editing.",
      "You can propose improvements or new sections, but avoid rewriting entire newsletters unless asked.",
      ctx.title ? `Current newsletter title: ${ctx.title}` : "",
      ctx.audience ? `Target audience: ${ctx.audience}` : "",
      ctx.tone ? `Preferred tone: ${ctx.tone}` : "",
      niche ? `Creator niche/topic: ${niche}` : "",
      ctx.currentContent
        ? "The user has existing content; you can reference it, but do not just repeat it."
        : "",
      "Your response must be ONLY the newsletter content or suggestions the user can paste into their newsletter.",
      "Do NOT include any explanations, meta commentary, or instructions.",
      "Do NOT include lines like 'I can tailor this...', 'Want a ready-to-paste section...', 'Let me know...', or any offer to help further.",
      "Do NOT refer to yourself (no 'I', 'me', 'as an AI', etc.) unless the user explicitly asks you to write in first person in the newsletter itself.",
      "Do NOT ask the user questions like 'Do you want me to...?' or 'Want a ready-to-paste section...?' at the end.",
      "End your response with the final sentence of the content itself, not with an extra offer or comment.",
      "Keep responses practical and concise. Where relevant, suggest concrete wording, not abstract advice.",
    ].filter(Boolean);

    const systemPrompt = systemParts.join("\n");

    const messages = input.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })) as { role: "user" | "assistant"; content: string }[];

    const reply = await OpenAIService.chat(systemPrompt, messages);
    const lastUserMessage = [...messages].reverse().find(
      (m) => m.role === "user"
    );
    const promptForStorage =
      lastUserMessage?.content ?? JSON.stringify(messages);

    const suggestion = await prisma.aiSuggestion.create({
      data: {
        userId: authUserId ?? null,
        creatorId: creatorId ?? null,
        type: "copilot",
        mode: null,
        prompt: promptForStorage,
        reply,
      },
    });

    res.json({
      reply,
      suggestionId: suggestion.id,
    });
  } catch (err) {
    next(err);
  }
};


export const acceptSuggestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUserId = req.user?.id;

    // 👇 Make sure TypeScript knows this is a definite string
    const { id } = req.params as { id: string };

    if (!id) {
      return res.status(400).json({ message: "Suggestion id is required" });
    }

    const suggestion = await prisma.aiSuggestion.findUnique({
      where: { id }, // id: string, not string | undefined
    });

    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    // Optional: only owner can mark accepted
    if (authUserId && suggestion.userId && suggestion.userId !== authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const updated = await prisma.aiSuggestion.update({
      where: { id }, // again: guaranteed string
      data: {
        accepted: true,
      },
    });

    return res.json({ success: true, suggestion: updated });
  } catch (err) {
    next(err);
  }
};