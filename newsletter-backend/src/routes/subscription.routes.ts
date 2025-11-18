import { Router } from "express";
import { subscribe, unsubscribe } from "../controllers/subscription.controller";

export const subscriptionRouter = Router();

// Public endpoints – no auth required
subscriptionRouter.post("/subscribe", subscribe);
subscriptionRouter.post("/unsubscribe", unsubscribe);
