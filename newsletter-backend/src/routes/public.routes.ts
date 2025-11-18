import { Router } from "express";
import {
  getPublicCreator,
  getPublicIssueByHandleAndSlug,
} from "../controllers/public.controller";

export const publicRouter = Router();

publicRouter.get("/creators/:handle", getPublicCreator);
publicRouter.get("/creators/:handle/issues/:slug", getPublicIssueByHandleAndSlug);
