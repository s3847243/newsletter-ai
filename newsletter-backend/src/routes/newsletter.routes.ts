import { Router } from "express";
import {
  createNewsletter,
  deleteMyNewsletter,
  getMyNewsletterById,
  listMyNewsletters,
  updateMyNewsletter,
} from "../controllers/newsletter.controller";
import { requireAuth } from "../middlewares/auth";

export const newsletterRouter = Router();

newsletterRouter.use(requireAuth);

newsletterRouter.get("/", listMyNewsletters);
newsletterRouter.post("/", createNewsletter);
newsletterRouter.get("/:id", getMyNewsletterById);
newsletterRouter.patch("/:id", updateMyNewsletter);
newsletterRouter.delete("/:id", deleteMyNewsletter);
