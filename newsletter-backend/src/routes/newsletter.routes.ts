import { Router } from "express";
import {
  createNewsletter,
  deleteMyNewsletter,
  getMyNewsletterById,
  listMyNewsletters,
  updateMyNewsletter,
} from "../controllers/newsletter.controller";
import { requireAuth } from "../middlewares/auth";
import { publishNewsletter } from "../controllers/publish.controller";
export const newsletterRouter = Router();

newsletterRouter.use(requireAuth);

newsletterRouter.get("/", listMyNewsletters);
newsletterRouter.post("/", createNewsletter);
newsletterRouter.get("/:id", getMyNewsletterById);
newsletterRouter.put("/:id", updateMyNewsletter);
newsletterRouter.delete("/:id", deleteMyNewsletter);

// NEW:
newsletterRouter.post("/:id/publish", publishNewsletter);