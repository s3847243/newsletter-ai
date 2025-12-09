// src/routes/creators.routes.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import {
  listFollowingCreators,
  searchCreators,
} from "../controllers/creator.controller";
import {
  followCreator,
  unfollowCreator,
} from "../controllers/follow.controller";

export const creatorsRouter = Router();

// All these require auth
creatorsRouter.use(requireAuth);

// GET /api/v1/creators/following
creatorsRouter.get("/following", listFollowingCreators);

// GET /api/v1/creators/search?query=...
creatorsRouter.get("/search", searchCreators);

// POST /api/v1/creators/:creatorId/follow
creatorsRouter.post("/:creatorId/follow", followCreator);

// POST /api/v1/creators/:creatorId/unfollow
creatorsRouter.post("/:creatorId/unfollow", unfollowCreator);
