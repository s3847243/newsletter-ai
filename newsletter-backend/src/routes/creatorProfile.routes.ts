import { Router } from "express";
import {
  createCreatorProfile,
  getCreatorByHandle,
  getMyCreatorProfile,
  updateCreatorProfile,
  listMyFollowers,
  listMyFollowing
} from "../controllers/creatorProfile.controller";
import { requireAuth } from "../middlewares/auth";

export const creatorProfileRouter = Router();

// Authenticated routes
creatorProfileRouter.get("/me", requireAuth, getMyCreatorProfile);
creatorProfileRouter.post("/", requireAuth, createCreatorProfile);
creatorProfileRouter.put("/", requireAuth, updateCreatorProfile);

creatorProfileRouter.get("/handle/:handle", getCreatorByHandle);
creatorProfileRouter.get("/me/followers", requireAuth, listMyFollowers);
creatorProfileRouter.get("/me/following", requireAuth, listMyFollowing);
