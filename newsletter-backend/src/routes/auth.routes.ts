import { Router } from "express";
import { login, register,refreshTokenHandler } from "../controllers/auth.controller";
import { forgotPassword } from "../controllers/forgot-password.controller";
import { resetPassword } from "../controllers/reset-password.controller";
export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshTokenHandler);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
