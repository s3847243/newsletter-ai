import { Router } from "express";
import {
  generateDraft,
  rewriteText,
  generateSubjectLines,
  copilotChat,
} from "../controllers/ai.controller";
import { requireAuth } from "../middlewares/auth";

export const aiRouter = Router();

// All AI endpoints require auth (so you can do quotas/limits later)
aiRouter.use(requireAuth);

aiRouter.post("/generate-draft", generateDraft);
aiRouter.post("/rewrite", rewriteText);
aiRouter.post("/subject-lines", generateSubjectLines);
aiRouter.post("/copilot", copilotChat);
