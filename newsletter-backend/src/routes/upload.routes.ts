import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { uploadImage } from "../controllers/upload.controller";
import { uploadMiddleware } from "../middlewares/upload.middleware";
import { getPresignedUploadUrl } from "../controllers/upload.controller";
export const uploadRouter = Router();

uploadRouter.post(
  "/presigned-url",
  requireAuth,
  getPresignedUploadUrl
);