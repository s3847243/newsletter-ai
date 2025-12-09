import { Router } from "express";
import { login, register,refreshTokenHandler } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshTokenHandler);