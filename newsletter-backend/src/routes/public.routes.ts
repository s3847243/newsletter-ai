import { Router } from "express";
import {
  getPublicCreator,
  getPublicIssueByHandleAndSlug,
  getPublicCreatorIssues,checkHandleAvailable
} from "../controllers/public.controller";

export const publicRouter = Router();

publicRouter.get("/creators/:handle", getPublicCreator);
publicRouter.get("/creators/:handle/issues", getPublicCreatorIssues);
publicRouter.get("/creators/:handle/issues/:slug", getPublicIssueByHandleAndSlug);
publicRouter.get("/creators/slug-available", checkHandleAvailable);