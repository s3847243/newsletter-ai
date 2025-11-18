import { Router } from "express";
import {
  createCreatorProfile,
  getCreatorByHandle,
  getMyCreatorProfile,
  updateCreatorProfile,
} from "../controllers/creatorProfile.controller";
import { requireAuth } from "../middlewares/auth";

export const creatorProfileRouter = Router();

// Authenticated routes
creatorProfileRouter.get("/me", requireAuth, getMyCreatorProfile);
creatorProfileRouter.post("/", requireAuth, createCreatorProfile);
creatorProfileRouter.put("/", requireAuth, updateCreatorProfile);

// Public route (also re-exported via /api/public later if you want)
creatorProfileRouter.get("/handle/:handle", getCreatorByHandle);
