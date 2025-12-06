// scripts/exportTrainingData.ts
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

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
- Respond in clean Markdown or HTML that can be converted to the editor.
- No surrounding backticks unless explicitly requested.
`.trim();

// Very naive HTML → Markdown-ish converter so we don't feed raw tags.
// You can replace this later with a real library like "turndown".
function htmlToMarkdown(html: string): string {
  let text = html;

  text = text.replace(/<\/h1>/gi, "\n\n");
  text = text.replace(/<h1[^>]*>/gi, "# ");
  text = text.replace(/<\/h2>/gi, "\n\n");
  text = text.replace(/<h2[^>]*>/gi, "## ");
  text = text.replace(/<\/h3>/gi, "\n\n");
  text = text.replace(/<h3[^>]*>/gi, "### ");

  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "");

  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "- ");

  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/?strong[^>]*>/gi, "**");
  text = text.replace(/<\/?em[^>]*>/gi, "_");

  // Remove any remaining tags
  text = text.replace(/<\/?[^>]+>/g, "");

  // Collapse excessive blank lines
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type TrainingExample = {
  messages: ChatMessage[];
};

async function buildFullIssueExamples(): Promise<TrainingExample[]> {
  const issues = await prisma.newsletterIssue.findMany({
    where: {
      status: "PUBLISHED",
      // only train on creators that allowed it, if you added the flag
      creator: {
        allowTraining: true,
      },
    },
    include: {
      creator: true,
    },
  });

  return issues.map((issue) => {
    const mdBody = htmlToMarkdown(issue.htmlContent || "");

    const audience = issue.creator?.niche
      ? `${issue.creator.niche} readers`
      : "general online audience";

    const userPrompt = `
Write a complete newsletter issue.

Title: ${issue.title}
Audience: ${audience}
Goal: provide value and build trust with readers.

Follow the style in the system prompt.
Return the full content in Markdown or simple HTML.
`.trim();

    const messages: ChatMessage[] = [
      { role: "system", content: BASE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
      { role: "assistant", content: mdBody },
    ];

    return { messages };
  });
}

async function buildSuggestionExamples(): Promise<TrainingExample[]> {
  const suggestions = await prisma.aiSuggestion.findMany({
    where: {
      accepted: true,
      // only train on creators that allowed it
      OR: [
        { creator: { allowTraining: true } },
        { creatorId: null }, // in case it's not tied to a creator
      ],
    },
  });

  return suggestions.map((sugg) => {
    // If you later store originalText or mode, you can enrich this further
    const userPrompt = `
You are helping improve part of a newsletter.

Instruction or request:
${sugg.prompt}

Write the improved version that the writer will paste directly into their newsletter.
`.trim();

    const messages: ChatMessage[] = [
      { role: "system", content: BASE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
      { role: "assistant", content: sugg.reply },
    ];

    return { messages };
  });
}

async function main() {
  console.log("Building training dataset from published issues and accepted suggestions...");

  const [fullIssueExamples, suggestionExamples] = await Promise.all([
    buildFullIssueExamples(),
    buildSuggestionExamples(),
  ]);

  const allExamples: TrainingExample[] = [
    ...fullIssueExamples,
    ...suggestionExamples,
  ];

  if (allExamples.length === 0) {
    console.warn("No training examples found. Did you mark any suggestions as accepted or publish any issues?");
  }

  const outputDir = path.join(process.cwd(), "training-data");
  const outputPath = path.join(outputDir, "newsletter_dataset.jsonl");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const stream = fs.createWriteStream(outputPath, { encoding: "utf-8" });

  for (const ex of allExamples) {
    stream.write(JSON.stringify(ex) + "\n");
  }

  stream.end();

  await new Promise((resolve) => stream.on("finish", resolve));

  console.log(`Wrote ${allExamples.length} examples to ${outputPath}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect().finally(() => process.exit(1));
});
