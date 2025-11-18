import { Router } from "express";
import { followCreator, unfollowCreator } from "../controllers/follow.controller";
import { requireAuth } from "../middlewares/auth";

export const followRouter = Router();

// POST /api/creators/:creatorId/follow
followRouter.post("/:creatorId/follow", requireAuth, followCreator);

// POST /api/creators/:creatorId/unfollow
followRouter.post("/:creatorId/unfollow", requireAuth, unfollowCreator);
