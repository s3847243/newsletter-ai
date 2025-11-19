import { z } from "zod";

// Generate draft for a newsletter
export const generateDraftSchema = z.object({
  title: z.string().min(1),
  audience: z.string().optional(),
  tone: z.string().optional(),       // e.g. "casual, friendly"
  goal: z.string().optional(),       // e.g. "promote my new course"
  outline: z.array(z.string()).optional(),
  wordCount: z.number().int().min(200).max(3000).optional(),
});

// Rewrite selected text
export const rewriteSchema = z.object({
  text: z.string().min(1),
  mode: z.enum(["improve", "shorten", "friendlier", "formal", "fix-grammar"]).default("improve"),
});

// Subject lines
export const subjectLinesSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  audience: z.string().optional(),
  count: z.number().int().min(1).max(10).optional(),
});

// Copilot chat
export const copilotSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  context: z
    .object({
      title: z.string().optional(),
      audience: z.string().optional(),
      tone: z.string().optional(),
      currentContent: z.string().optional(),
    })
    .optional(),
});

export type GenerateDraftInput = z.infer<typeof generateDraftSchema>;
export type RewriteInput = z.infer<typeof rewriteSchema>;
export type SubjectLinesInput = z.infer<typeof subjectLinesSchema>;
export type CopilotInput = z.infer<typeof copilotSchema>;
