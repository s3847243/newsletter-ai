import { Router } from "express";
import { getTimeline } from "../controllers/timeline.controller";
import { requireAuth } from "../middlewares/auth";

export const timelineRouter = Router();

timelineRouter.get("/", requireAuth, getTimeline);
