import { Router } from "express";
import {
  createNewsletter,
  deleteMyNewsletter,
  getMyNewsletterById,
  listMyNewsletters,
  updateMyNewsletter,
  softDeleteNewsletter,
  restoreNewsletter
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

newsletterRouter.post("/:id/publish", publishNewsletter);
newsletterRouter.delete("/:id", softDeleteNewsletter);
newsletterRouter.post("/:id/restore", restoreNewsletter);